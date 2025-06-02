#include <iostream>
#include <string>
#include <chrono>
#include <thread>

#if defined(__linux__) || defined(__APPLE__) || defined(__FreeBSD__)
#include <signal.h>
#include <unistd.h>

#elif defined(_WIN32)
#define _WINSOCKAPI_
#include <windows.h>
#endif

#include "lib/json/json.hpp"
#include "settings.h"
#include "helpers.h"
#include "errors.h"
#include "server/neuserver.h"
#include "api/app/app.h"
#include "api/window/window.h"
#include "api/os/os.h"
#include "extensions_loader.h"
#include "api/os/os.h"
#include "api/events/events.h"

using namespace std;
using json = nlohmann::json;

namespace app {

void exit(int code) {
    try {
        // Cleanup extensions first
        if(extensions::isInitialized()) {
            extensions::cleanup();
        }
        
        // Cleanup spawned processes
        os::cleanupAllSpawnedProcesses();
        
        // Clean up server
        if(neuserver::isInitialized()) {
            neuserver::stop();
        }
        
        // Clean up tray
        if(os::isTrayInitialized()) {
            os::cleanupTray();
        }
        
        // Clean up window and exit
        if(settings::getMode() == settings::AppModeWindow) {
            window::_close(code);
        }
        else {
            // Give a brief moment for cleanup to complete
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            std::exit(code);
        }
    }
    catch(...) {
        // If cleanup fails, force exit to prevent hanging
        std::exit(code);
    }
}

unsigned int getProcessId() {
    #if defined(__linux__) || defined(__FreeBSD__) || defined(__APPLE__)
    return getpid();
    #elif defined(_WIN32)
    return GetCurrentProcessId();
    #endif
}

namespace controllers {

json exit(const json &input) {
    int code = 0;
    if(helpers::hasField(input, "code")) {
        code = input["code"].get<int>();
    }
    app::exit(code);
    return nullptr;
}

json killProcess(const json &input) {
    #if defined(__linux__) || defined(__APPLE__) || defined(__FreeBSD__)
    kill(getpid(),SIGINT);
    #elif defined(_WIN32)
    DWORD pid = GetCurrentProcessId();
    HANDLE hnd = OpenProcess(SYNCHRONIZE | PROCESS_TERMINATE, TRUE, pid);
    TerminateProcess(hnd, 137);
    CloseHandle(hnd);
    #endif
    return nullptr;
}

json getConfig(const json &input) {
    json output;
    output["returnValue"] = settings::getConfig();
    output["success"] = true;
    return output;
}

json broadcast(const json &input) {
    json output;
    if(!helpers::hasRequiredFields(input, {"event"})) {
        output["error"] = errors::makeMissingArgErrorPayload();
        return output;
    }
    string event = input["event"].get<string>();
    json data = nullptr;

    if(helpers::hasField(input, "data")) {
        data = input["data"];
    }

    events::dispatchToAllApps(event, data);
    output["success"] = true;

    return output;
}

json readProcessInput(const json &input) {
    json output;
    string line, lines;
    bool readAll = false;

    if(helpers::hasField(input, "readAll")) {
        readAll = input["readAll"].get<bool>();
    }

    while(getline(cin, line) && !line.empty()) {
        lines += line;
        if(!readAll) {
            break;
        }
        lines += "\n";
    }
    output["returnValue"] = lines;
    output["success"] = true;
    return output;
}

json writeProcessOutput(const json &input) {
    json output;
    if(!helpers::hasRequiredFields(input, {"data"})) {
        output["error"] = errors::makeMissingArgErrorPayload();
        return output;
    }

    cout << input["data"].get<string>() << flush;

    output["message"] = "Wrote data to stdout";
    output["success"] = true;
    return output;
}

json writeProcessError(const json &input) {
    json output;
    if(!helpers::hasRequiredFields(input, {"data"})) {
        output["error"] = errors::makeMissingArgErrorPayload();
        return output;
    }

    cerr << input["data"].get<string>() << flush;

    output["message"] = "Wrote data to stderr";
    output["success"] = true;
    return output;
}

} // namespace controllers
} // namespace app
