#ifndef NEU_EXTENSIONS_H
#define NEU_EXTENSIONS_H

#include <string>
#include <vector>

#include "lib/json/json.hpp"

using namespace std;
using json = nlohmann::json;

namespace extensions {

void init();
void loadOne(const string &extensionId);
vector<string> getLoaded();
bool isLoaded(const string &extensionId);
bool isInitialized();
void cleanup(); // Add cleanup function for extension processes

} // namesapce extensions

#endif // #define NEU_EXTENSIONS_H

