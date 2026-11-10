// Test-only Windows input/capture driver. Every command validates its owned PID.
#include <Windows.h>
#include <Psapi.h>
#include <cstdio>
#include <string>
#include <vector>
#include <fstream>

static DWORD target_pid;
static HWND target_window;
static BOOL CALLBACK find_window(HWND window, LPARAM) {
    DWORD pid = 0;
    GetWindowThreadProcessId(window, &pid);
    if (pid == target_pid && IsWindowVisible(window) && GetWindow(window, GW_OWNER) == nullptr) {
        target_window = window;
        return FALSE;
    }
    return TRUE;
}
static std::string utf8(const std::wstring &text) {
    const int size = WideCharToMultiByte(CP_UTF8, 0, text.data(), (int)text.size(), nullptr, 0, nullptr, nullptr);
    std::string result(size, '\0');
    WideCharToMultiByte(CP_UTF8, 0, text.data(), (int)text.size(), result.data(), size, nullptr, nullptr);
    return result;
}
static std::string json_string(const std::wstring &text) {
    std::string out = "\"";
    for (const char c : utf8(text)) {
        if (c == '\\' || c == '"') out += '\\';
        if ((unsigned char)c < 32) return "null";
        out += c;
    }
    return out + "\"";
}
static bool activate() {
    const DWORD current = GetCurrentThreadId();
    const DWORD target = GetWindowThreadProcessId(target_window, nullptr);
    const DWORD foreground = GetWindowThreadProcessId(GetForegroundWindow(), nullptr);
    const bool a = target && target != current && AttachThreadInput(current, target, TRUE);
    const bool b = foreground && foreground != current && foreground != target && AttachThreadInput(current, foreground, TRUE);
    ShowWindow(target_window, SW_RESTORE);
    BringWindowToTop(target_window);
    const bool requested = SetForegroundWindow(target_window) != FALSE;
    if (b) AttachThreadInput(current, foreground, FALSE);
    if (a) AttachThreadInput(current, target, FALSE);
    const HWND observed = GetForegroundWindow();
    if (observed != target_window) {
        DWORD foreground_pid = 0;
        GetWindowThreadProcessId(observed, &foreground_pid);
        std::fprintf(stderr, "Fixture activation failed: targetPid=%lu foregroundPid=%lu requested=%d attachedTarget=%d attachedForeground=%d minimized=%d enabled=%d alt=%d control=%d shift=%d\n",
            target_pid, foreground_pid, requested, a, b, IsIconic(target_window), IsWindowEnabled(target_window),
            GetAsyncKeyState(VK_MENU) < 0, GetAsyncKeyState(VK_CONTROL) < 0, GetAsyncKeyState(VK_SHIFT) < 0);
    }
    return observed == target_window;
}
static void add_key(std::vector<INPUT> &inputs, WORD vk, bool up) {
    INPUT input{};
    input.type = INPUT_KEYBOARD;
    input.ki.wVk = vk;
    input.ki.dwFlags = up ? KEYEVENTF_KEYUP : 0;
    inputs.push_back(input);
}
int wmain(int argc, wchar_t **argv) {
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
    if (argc < 4) return 2;
    target_pid = wcstoul(argv[1], nullptr, 10);
    const std::wstring expected_image = argv[2], command = argv[3];
    HANDLE process = OpenProcess(command == L"module" ? PROCESS_QUERY_INFORMATION | PROCESS_VM_READ : PROCESS_QUERY_LIMITED_INFORMATION, FALSE, target_pid);
    wchar_t image[32768]{};
    DWORD size = 32768;
    const bool valid = process && QueryFullProcessImageNameW(process, 0, image, &size) && _wcsicmp(image, expected_image.c_str()) == 0;
    if (!valid) { if (process) CloseHandle(process); std::fprintf(stderr, "Owned fixture identity mismatch\n"); return 3; }
    if (command == L"token") {
        HANDLE token = nullptr;
        TOKEN_ELEVATION elevation{};
        DWORD length = 0, session = 0;
        FILETIME creation{}, exit{}, kernel{}, user{};
        bool ok = OpenProcessToken(process, TOKEN_QUERY, &token) &&
            GetTokenInformation(token, TokenElevation, &elevation, sizeof(elevation), &length) &&
            GetTokenInformation(token, TokenSessionId, &session, sizeof(session), &length) &&
            GetProcessTimes(process, &creation, &exit, &kernel, &user);
        DWORD needed = 0, integrity = 0;
        if (ok) {
            GetTokenInformation(token, TokenIntegrityLevel, nullptr, 0, &needed);
            std::vector<BYTE> data(needed);
            ok = needed && GetTokenInformation(token, TokenIntegrityLevel, data.data(), needed, &length);
            if (ok) {
                const auto label = reinterpret_cast<TOKEN_MANDATORY_LABEL *>(data.data());
                ok = IsValidSid(label->Label.Sid) && *GetSidSubAuthorityCount(label->Label.Sid) > 0;
                if (ok) integrity = *GetSidSubAuthority(label->Label.Sid, *GetSidSubAuthorityCount(label->Label.Sid) - 1);
            }
        }
        const DWORD error = ok ? 0 : GetLastError();
        if (token) CloseHandle(token);
        CloseHandle(process);
        if (!ok) { std::fprintf(stderr, "Owned token query failed: %lu\n", error); return 14; }
        const auto birth = (static_cast<unsigned long long>(creation.dwHighDateTime) << 32) | creation.dwLowDateTime;
        std::printf("{\"pid\":%lu,\"elevated\":%s,\"integrityRid\":%lu,\"sessionId\":%lu,\"creationTime100ns\":\"%llu\"}\n", target_pid, elevation.TokenIsElevated ? "true" : "false", integrity, session, birth);
        return 0;
    }
    if (command == L"module") {
        std::wstring found;
        DWORD query_error = ERROR_INSUFFICIENT_BUFFER, max_path_length = 0;
        std::vector<HMODULE> modules(128);
        // Toolhelp fails the entire snapshot when any loaded module's path is
        // longer than MAX_PATH. Inspect handles and grow path buffers instead.
        for (int attempt = 0; attempt < 8; ++attempt) {
            DWORD needed = 0;
            if (!K32EnumProcessModulesEx(process, modules.data(), (DWORD)(modules.size() * sizeof(HMODULE)), &needed, LIST_MODULES_ALL)) {
                query_error = GetLastError(); break;
            }
            if (needed % sizeof(HMODULE) != 0 || needed / sizeof(HMODULE) > 65536) {
                query_error = ERROR_BAD_LENGTH; break;
            }
            if (needed > modules.size() * sizeof(HMODULE)) {
                modules.resize(needed / sizeof(HMODULE)); continue;
            }
            modules.resize(needed / sizeof(HMODULE));
            query_error = ERROR_SUCCESS;
            for (const HMODULE module : modules) {
                std::vector<wchar_t> buffer(1024);
                for (;;) {
                    const DWORD length = K32GetModuleFileNameExW(process, module, buffer.data(), (DWORD)buffer.size());
                    if (!length) break; // A module can unload during inspection.
                    if (length >= buffer.size()) {
                        if (buffer.size() >= 32768) break;
                        buffer.resize(buffer.size() * 2); continue;
                    }
                    if (length > max_path_length) max_path_length = length;
                    const std::wstring full_path(buffer.data(), length);
                    const auto slash = full_path.find_last_of(L"\\/");
                    const wchar_t *name = full_path.c_str() + (slash == std::wstring::npos ? 0 : slash + 1);
                    if (!_wcsicmp(name, L"ReShade64.dll") || !_wcsicmp(name, L"ReShade32.dll")) found = full_path;
                    break;
                }
            }
            break;
        }
        CloseHandle(process);
        std::printf("{\"module\":%s,\"queryError\":%lu,\"maxModulePathLength\":%lu,\"inspector\":\"K32EnumProcessModulesEx\"}\n", json_string(found).c_str(), query_error, max_path_length);
        return 0;
    }
    CloseHandle(process);
    EnumWindows(find_window, 0);
    if (!target_window) { std::fprintf(stderr, "Fixture window unavailable\n"); return 4; }
    if (command == L"close") {
        PostMessageW(target_window, WM_CLOSE, 0, 0);
    } else if (command == L"activate") {
        if (!activate()) return 5;
    } else if (command == L"move" || command == L"click" || command == L"wheel") {
        if (GetForegroundWindow() != target_window) {
            DWORD foreground_pid = 0;
            GetWindowThreadProcessId(GetForegroundWindow(), &foreground_pid);
            std::fprintf(stderr, "Pointer input refused: targetPid=%lu foregroundPid=%lu\n", target_pid, foreground_pid);
            return 6;
        }
        std::vector<INPUT> inputs;
        INPUT input{}; input.type = INPUT_MOUSE;
        if (command == L"move") {
            int x = 0, y = 0;
            RECT client{}; GetClientRect(target_window, &client);
            if (argc < 5 || swscanf_s(argv[4], L"%d,%d", &x, &y) != 2 || x < 0 || y < 0 || x >= client.right || y >= client.bottom) return 2;
            POINT point{x, y}; if (!ClientToScreen(target_window, &point)) return 8;
            input.mi.dx = MulDiv(point.x - GetSystemMetrics(SM_XVIRTUALSCREEN), 65535, GetSystemMetrics(SM_CXVIRTUALSCREEN) - 1);
            input.mi.dy = MulDiv(point.y - GetSystemMetrics(SM_YVIRTUALSCREEN), 65535, GetSystemMetrics(SM_CYVIRTUALSCREEN) - 1);
            input.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK;
            inputs.push_back(input);
        } else {
            CURSORINFO cursor{}; cursor.cbSize = sizeof(cursor);
            RECT bounds{}; GetClientRect(target_window, &bounds);
            if (!GetCursorInfo(&cursor)) return 8;
            POINT point = cursor.ptScreenPos; ScreenToClient(target_window, &point);
            if (!PtInRect(&bounds, point)) {
                std::fprintf(stderr, "Pointer outside fixture: x=%ld y=%ld width=%ld height=%ld\n", point.x, point.y, bounds.right, bounds.bottom);
                return 6;
            }
            if (command == L"click") {
                input.mi.dwFlags = MOUSEEVENTF_LEFTDOWN; inputs.push_back(input);
                input.mi.dwFlags = MOUSEEVENTF_LEFTUP; inputs.push_back(input);
            } else {
                if (argc < 5) return 2;
                input.mi.dwFlags = MOUSEEVENTF_WHEEL;
                input.mi.mouseData = (DWORD)wcstol(argv[4], nullptr, 10);
                inputs.push_back(input);
            }
        }
        if (SendInput((UINT)inputs.size(), inputs.data(), sizeof(INPUT)) != inputs.size()) {
            if (command == L"click") { input.mi.dwFlags = MOUSEEVENTF_LEFTUP; SendInput(1, &input, sizeof(INPUT)); }
            return 7;
        }
    } else if (command == L"key" || command == L"shortcut") {
        if (GetForegroundWindow() != target_window) { std::fprintf(stderr, "Fixture is not foreground\n"); return 6; }
        if (argc < 5) return 2;
        const WORD vk = (WORD)wcstoul(argv[4], nullptr, 10);
        std::vector<INPUT> inputs;
        if (command == L"shortcut") add_key(inputs, VK_CONTROL, false);
        add_key(inputs, vk, false);
        add_key(inputs, vk, true);
        if (command == L"shortcut") add_key(inputs, VK_CONTROL, true);
        if (SendInput((UINT)inputs.size(), inputs.data(), sizeof(INPUT)) != inputs.size()) {
            inputs.clear(); add_key(inputs, vk, true); add_key(inputs, VK_CONTROL, true);
            SendInput((UINT)inputs.size(), inputs.data(), sizeof(INPUT));
            return 7;
        }
    } else if (command == L"capture") {
        if (argc < 5 || GetForegroundWindow() != target_window) return 6;
        RECT bounds{}; GetClientRect(target_window, &bounds);
        const int width = bounds.right, height = bounds.bottom;
        POINT origin{}; ClientToScreen(target_window, &origin);
        HDC screen = GetDC(nullptr), memory = CreateCompatibleDC(screen);
        BITMAPINFO info{}; info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
        info.bmiHeader.biWidth = width; info.bmiHeader.biHeight = -height;
        info.bmiHeader.biPlanes = 1; info.bmiHeader.biBitCount = 32; info.bmiHeader.biCompression = BI_RGB;
        void *pixels = nullptr;
        HBITMAP bitmap = CreateDIBSection(screen, &info, DIB_RGB_COLORS, &pixels, nullptr, 0);
        if (!bitmap) return 8;
        HGDIOBJ prior = SelectObject(memory, bitmap);
        const bool captured = BitBlt(memory, 0, 0, width, height, screen, origin.x, origin.y, SRCCOPY | CAPTUREBLT) != FALSE;
        for (int index = 0; index < width * height; ++index) ((unsigned char *)pixels)[index * 4 + 3] = 255;
        BITMAPFILEHEADER header{}; header.bfType = 0x4d42;
        header.bfOffBits = sizeof(header) + sizeof(info.bmiHeader); header.bfSize = header.bfOffBits + width * height * 4;
        std::ofstream file(argv[4], std::ios::binary);
        file.write((const char *)&header, sizeof(header)); file.write((const char *)&info.bmiHeader, sizeof(info.bmiHeader));
        file.write((const char *)pixels, (std::streamsize)width * height * 4);
        const bool written = file.good();
        SelectObject(memory, prior); DeleteObject(bitmap); DeleteDC(memory); ReleaseDC(nullptr, screen);
        if (!captured || !written) return 9;
    } else if (command != L"state") return 2;
    CURSORINFO cursor{}; cursor.cbSize = sizeof(cursor); GetCursorInfo(&cursor);
    const char *shape = "other";
    if (!(cursor.flags & CURSOR_SHOWING)) shape = "hidden";
    else if (cursor.hCursor == LoadCursorW(nullptr, IDC_ARROW)) shape = "arrow";
    else if (cursor.hCursor == LoadCursorW(nullptr, IDC_IBEAM)) shape = "text";
    else if (cursor.hCursor == LoadCursorW(nullptr, IDC_HAND)) shape = "pointer";
    else if (cursor.hCursor == LoadCursorW(nullptr, IDC_SIZEALL)) shape = "move";
    RECT client{}; GetClientRect(target_window, &client);
    wchar_t title[2048]{}; GetWindowTextW(target_window, title, 2048);
    std::printf("{\"foreground\":%s,\"title\":%s,\"width\":%ld,\"height\":%ld,\"cursor\":\"%s\"}\n", GetForegroundWindow() == target_window ? "true" : "false", json_string(title).c_str(), client.right, client.bottom, shape);
    return 0;
}
