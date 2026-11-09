// Owned inert target and retained-handle owner for failure/recovery E2E.
// This never selects an existing process or executes a user-provided binary.
#include <Windows.h>
#include <filesystem>
#include <fstream>
#include <iterator>
#include <string>
#include <vector>

static std::vector<char> bytes(const wchar_t *filename) {
    std::ifstream stream(std::filesystem::path(filename), std::ios::binary);
    return {std::istreambuf_iterator<char>(stream), std::istreambuf_iterator<char>()};
}
int wmain(int argc, wchar_t **argv) {
    if (argc == 3 && std::wstring(argv[1]) == L"--wait") {
        for (int i = 0; i < 450; ++i) {
            if (GetFileAttributesW(argv[2]) != INVALID_FILE_ATTRIBUTES) return 0;
            Sleep(100);
        }
        return 10;
    }
    if (argc != 5 || std::wstring(argv[1]) != L"--own") return 2;
    const std::wstring mode = argv[4], prefix = argv[3];
    if (mode != L"suspended" && mode != L"timeout") return 3;
    wchar_t self[32768]{};
    if (!GetModuleFileNameW(nullptr, self, 32768)) return 4;
    const auto own_bytes = bytes(self);
    if (own_bytes.empty() || own_bytes != bytes(argv[2])) return 5;
    const std::wstring stop = prefix + L".stop";
    std::wstring command = L"\"" + std::wstring(argv[2]) + L"\" --wait \"" + stop + L"\"";
    HANDLE job = CreateJobObjectW(nullptr, nullptr);
    JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits{};
    limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
    if (!job || !SetInformationJobObject(job, JobObjectExtendedLimitInformation, &limits, sizeof(limits))) {
        if (job) CloseHandle(job);
        return 6;
    }
    STARTUPINFOW startup{sizeof(startup)};
    PROCESS_INFORMATION process{};
    // Always assign the owned child to the kill-on-close job before it runs.
    if (!CreateProcessW(argv[2], command.data(), nullptr, nullptr, FALSE,
        CREATE_NO_WINDOW | CREATE_SUSPENDED, nullptr, nullptr, &startup, &process)) {
        CloseHandle(job);
        return 7;
    }
    if (!AssignProcessToJobObject(job, process.hProcess)) {
        TerminateProcess(process.hProcess, 11);
        CloseHandle(process.hThread); CloseHandle(process.hProcess); CloseHandle(job);
        return 8;
    }
    FILETIME creation{}, exit{}, kernel{}, user{};
    if (!GetProcessTimes(process.hProcess, &creation, &exit, &kernel, &user)) {
        CloseHandle(process.hThread); CloseHandle(process.hProcess); CloseHandle(job);
        return 9;
    }
    if (mode == L"timeout" && ResumeThread(process.hThread) == DWORD(-1)) {
        CloseHandle(process.hThread); CloseHandle(process.hProcess); CloseHandle(job);
        return 12;
    }
    CloseHandle(process.hThread);
    const auto timestamp = (static_cast<unsigned long long>(creation.dwHighDateTime) << 32) | creation.dwLowDateTime;
    {
        std::ofstream state(std::filesystem::path(prefix + L".tmp"));
        state << "{\"pid\":" << process.dwProcessId << ",\"creationTime100ns\":\"" << timestamp << "\"}";
    }
    if (!MoveFileExW((prefix + L".tmp").c_str(), (prefix + L".json").c_str(), MOVEFILE_WRITE_THROUGH)) {
        CloseHandle(process.hProcess); CloseHandle(job);
        return 14;
    }
    bool requested = false;
    for (int i = 0; i < 400 && WaitForSingleObject(process.hProcess, 0) == WAIT_TIMEOUT; ++i) {
        if (GetFileAttributesW(stop.c_str()) != INVALID_FILE_ATTRIBUTES) { requested = true; break; }
        Sleep(100);
    }
    // Only the retained handle returned by our own CreateProcess is terminated.
    if (WaitForSingleObject(process.hProcess, 2000) == WAIT_TIMEOUT) TerminateProcess(process.hProcess, 0);
    const bool exited = WaitForSingleObject(process.hProcess, 5000) == WAIT_OBJECT_0;
    CloseHandle(process.hProcess); CloseHandle(job);
    if (exited) { std::ofstream marker(std::filesystem::path(prefix + L".exited")); marker << timestamp; }
    requested = requested || GetFileAttributesW(stop.c_str()) != INVALID_FILE_ATTRIBUTES;
    return exited && requested ? 0 : 13;
}
