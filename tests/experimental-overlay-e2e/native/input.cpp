// Test-only Windows keyboard/capture driver. No pointer input is implemented.
#include <Windows.h>
#include <TlHelp32.h>
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
    SetForegroundWindow(target_window);
    if (b) AttachThreadInput(current, foreground, FALSE);
    if (a) AttachThreadInput(current, target, FALSE);
    return GetForegroundWindow() == target_window;
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
    HANDLE process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, target_pid);
    wchar_t image[32768]{};
    DWORD size = 32768;
    const bool valid = process && QueryFullProcessImageNameW(process, 0, image, &size) && _wcsicmp(image, expected_image.c_str()) == 0;
    if (process) CloseHandle(process);
    if (!valid) { std::fprintf(stderr, "Owned fixture identity mismatch\n"); return 3; }
    if (command == L"module") {
        HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, target_pid);
        MODULEENTRY32W entry{}; entry.dwSize = sizeof(entry);
        std::wstring found;
        if (snapshot != INVALID_HANDLE_VALUE) {
            if (Module32FirstW(snapshot, &entry)) do {
                if (!_wcsicmp(entry.szModule, L"ReShade64.dll") || !_wcsicmp(entry.szModule, L"ReShade32.dll")) { found = entry.szExePath; break; }
            } while (Module32NextW(snapshot, &entry));
            CloseHandle(snapshot);
        }
        std::printf("{\"module\":%s}\n", json_string(found).c_str());
        return 0;
    }
    EnumWindows(find_window, 0);
    if (!target_window) { std::fprintf(stderr, "Fixture window unavailable\n"); return 4; }
    if (command == L"close") {
        PostMessageW(target_window, WM_CLOSE, 0, 0);
    } else if (command == L"activate") {
        if (!activate()) return 5;
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
    wchar_t title[2048]{}; GetWindowTextW(target_window, title, 2048);
    std::printf("{\"foreground\":%s,\"title\":%s}\n", GetForegroundWindow() == target_window ? "true" : "false", json_string(title).c_str());
    return 0;
}
