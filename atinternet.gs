var userProperties = PropertiesService.getUserProperties();
var userMail = userProperties.getProperty('ATMAIL');
var atToken = userProperties.getProperty('ATTOKEN');
var atConfigSheet = userProperties.getProperty('ATCONFIGSHEET') || "AT Config Sheet";
var authentUrl = "https://apirest.atinternet-solutions.com/rest/config/v1/authentication/authentication/";

function onOpen(e) {
  
  userProperties = PropertiesService.getUserProperties();
  userMail = userProperties.getProperty('ATMAIL');
  atToken = userProperties.getProperty('ATTOKEN');
  
  ui = SpreadsheetApp.getUi();
  
  if(atToken !== null) {
    addLoggedInMenu(userMail);
  } else {
    SpreadsheetApp.getUi()
    .createMenu('AT Internet')
    .addItem('Login', 'ATLogin')
    .addToUi();
  }
  
}

function ATLogin() {
  
  var ui = SpreadsheetApp.getUi();
  var mailResponse = ui.prompt('Enter your email:');
  userProperties.setProperty('ATMAIL', mailResponse.getResponseText());
  
  var pwdResponse = ui.prompt('Enter your password:');
  
  var b64 = Utilities.base64Encode(mailResponse.getResponseText() + ":" + pwdResponse.getResponseText());
  var header = {"Authorization": "Basic " + b64};
  var jsondata = UrlFetchApp.fetch(authentUrl, {'muteHttpExceptions': true, 'headers': header});
  
  if(jsondata.getResponseCode() == 200) {
    var object = JSON.parse(jsondata.getContentText());
    ui.alert('Logged in!');
    
    userProperties.setProperty('ATTOKEN', object.ExpiringToken);
    
    addLoggedInMenu(mailResponse.getResponseText());
  } else {
    ui.alert('Wrong credentials!');
  }  
  
}

function ATLogout() {
  
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('ATMAIL');
  userProperties.deleteProperty('ATTOKEN');
  
  SpreadsheetApp.getUi().alert('Logged out');
  
  SpreadsheetApp.getUi()
    .createMenu('AT Internet')
    .addItem('Login', 'ATLogin')
    .addToUi();
  
}

function ATAddRequest() {
  var ui = SpreadsheetApp.getUi();
  var apiUrlResponse = ui.prompt('Enter your API query URL:');

  SpreadsheetApp.getActiveSheet().getActiveCell().setValue("=ImportATInternetBasicAuth(\""+apiUrlResponse.getResponseText()+"\")");
}

function ATCreateSheet() {
  var ui = SpreadsheetApp.getUi();
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var yourNewSheet = activeSpreadsheet.getSheetByName(atConfigSheet);
  
  if (yourNewSheet != null) {
    var response = ui.alert('AT Config Sheet already exists', 'Proceeding will delete the current config and will create a new one. Are you sure you want to continue?', ui.ButtonSet.YES_NO);

    if (response == ui.Button.YES) {
      activeSpreadsheet.deleteSheet(yourNewSheet);

      yourNewSheet = activeSpreadsheet.insertSheet();
      yourNewSheet.setName(atConfigSheet);
      
      yourNewSheet.getRange(1,1,2,2).setValues([["Start date", "2018-01-01"],["End date", "2018-01-10"]]);
    }     
  }
  
  
}

function addLoggedInMenu(mail) {
  SpreadsheetApp.getUi()
    .createMenu('AT Internet')
    .addItem('Add a request in the current cell', 'ATAddRequest')
    //.addItem('Create config sheet', 'ATCreateSheet')
    .addSeparator()
    .addItem('Logout', 'ATLogout')
    .addItem('Logged in as '+mail, 'ATLogout')
    .addToUi();
}

function ImportJSON(url, query, parseOptions) {
  return ImportJSONAdvanced(url, null, query, parseOptions, includeXPath_, defaultTransform_);
}


/**
 * An advanced version of ImportJSON designed to be easily extended by a script. This version cannot be called from within a 
 * spreadsheet.
 * 
 * Imports a JSON feed and returns the results to be inserted into a Google Spreadsheet. The JSON feed is flattened to create 
 * a two-dimensional array. The first row contains the headers, with each column header indicating the path to that data in 
 * the JSON feed. The remaining rows contain the data. 
 *
 * The fetchOptions can be used to change how the JSON feed is retrieved. For instance, the "method" and "payload" options can be 
 * set to pass a POST request with post parameters. For more information on the available parameters, see 
 * https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app .
 *
 * Use the include and transformation functions to determine what to include in the import and how to transform the data after it is
 * imported. 
 *
 * For example:
 *
 *   ImportJSON("http://gdata.youtube.com/feeds/api/standardfeeds/most_popular?v=2&alt=json", 
 *              new Object() { "method" : "post", "payload" : "user=bob&apikey=xxxx" },
 *              "/feed/entry",
 *              "",
 *              function (query, path) { return path.indexOf(query) == 0; },
 *              function (data, row, column) { data[row][column] = data[row][column].toString().substr(0, 100); } )
 *
 * In this example, the import function checks to see if the path to the data being imported starts with the query. The transform 
 * function takes the data and truncates it. For more robust versions of these functions, see the internal code of this library.
 *
 * @param {url}           the URL to a public JSON feed
 * @param {fetchOptions}  an object whose properties are options used to retrieve the JSON feed from the URL
 * @param {query}         the query passed to the include function
 * @param {parseOptions}  a comma-separated list of options that may alter processing of the data
 * @param {includeFunc}   a function with the signature func(query, path, options) that returns true if the data element at the given path
 *                        should be included or false otherwise. 
 * @param {transformFunc} a function with the signature func(data, row, column, options) where data is a 2-dimensional array of the data 
 *                        and row & column are the current row and column being processed. Any return value is ignored. Note that row 0 
 *                        contains the headers for the data, so test for row==0 to process headers only.
 *
 * @return a two-dimensional array containing the data, with the first row containing headers
 * @customfunction
 **/
function ImportJSONAdvanced(url, fetchOptions, query, parseOptions, includeFunc, transformFunc) {
  var jsondata = UrlFetchApp.fetch(url, fetchOptions);
  var object   = JSON.parse(jsondata.getContentText());
  
  return parseJSONObject_(object, query, parseOptions, includeFunc, transformFunc);
}

function ImportATInternet(url, fetchOptions, includeFunc, transformFunc) {
  var encodedQuery = getEncodedQuery(url);
  var jsondata = UrlFetchApp.fetch(url.split("?")[0] + '?' + encodedQuery, fetchOptions);
  
  var object   = JSON.parse(jsondata.getContentText());
  
  return parseJSONObject_(object.DataFeed[0].Rows, "", "", includeFunc, transformFunc);
}

function getEncodedQuery(url) {
  serialize = function(obj) {
    var str = [];
    for(var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }
  
  var urlParams = url.split("?")[1];
  var urlParams = (urlParams.charAt(0)==="&") ? urlParams.substr(1) : urlParams;
  var finalURL = JSON.parse(
                   '{"' + urlParams.replace(/&/g, '","').replace(/=/g,'":"') + '"}', 
                       function(key, value) {
                        return key===""?value:decodeURIComponent(value); 
                    });  
                 
  return serialize(finalURL);
}

/**
 * Helper function to authenticate with basic auth informations using ImportJSONAdvanced
 *
 * Imports a JSON feed and returns the results to be inserted into a Google Spreadsheet. The JSON feed is flattened to create
 * a two-dimensional array. The first row contains the headers, with each column header indicating the path to that data in
 * the JSON feed. The remaining rows contain the data.
 *
 * The fetchOptions can be used to change how the JSON feed is retrieved. For instance, the "method" and "payload" options can be
 * set to pass a POST request with post parameters. For more information on the available parameters, see
 * https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app .
 *
 * Use the include and transformation functions to determine what to include in the import and how to transform the data after it is
 * imported.
 *
 * @param {url}           the URL to a http basic auth protected JSON feed
 * @param {username}      the Username for authentication
 * @param {password}      the Password for authentication
 * @param {query}         the query passed to the include function (optional)
 * @param {parseOptions}  a comma-separated list of options that may alter processing of the data (optional)
 *
 * @return a two-dimensional array containing the data, with the first row containing headers
 * @customfunction
 **/
function ImportJSONBasicAuth(url, username, password, query, parseOptions) {
  var encodedAuthInformation = Utilities.base64Encode(username + ":" + password);
  var header = {headers: {Authorization: "Basic " + encodedAuthInformation}};
  return ImportJSONAdvanced(url, header, query, parseOptions, includeXPath_, defaultTransform_);
}

function ImportATInternetBasicAuth(url) {
  var atToken = userProperties.getProperty('ATTOKEN');
  
  var header = {headers: {Authorization: "Token " + atToken}};
  return ImportATInternet(url, header, includeXPath_, defaultTransform_);
}

/** 
 * Encodes the given value to use within a URL.
 *
 * @param {value} the value to be encoded
 * 
 * @return the value encoded using URL percent-encoding
 */
function URLEncode(value) {
  return encodeURIComponent(value.toString());
}

/** 
 * Parses a JSON object and returns a two-dimensional array containing the data of that object.
 */
function parseJSONObject_(object, query, options, includeFunc, transformFunc) {
  var headers = new Array();
  var data    = new Array();
  
  if (query && !Array.isArray(query) && query.toString().indexOf(",") != -1) {
    query = query.toString().split(",");
  }
  
  if (options) {
    options = options.toString().split(",");
  }
    
  parseData_(headers, data, "", {rowIndex: 1}, object, query, options, includeFunc);
  parseHeaders_(headers, data);
  transformData_(data, options, transformFunc);
  
  return hasOption_(options, "noHeaders") ? (data.length > 1 ? data.slice(1) : new Array()) : data;
}

function filterFloat(value) {
  if(/^(-|\+)?([0-9]+(.[0-9]+)?|Infinity)$/.test(value)) {
    return Number(value);
  }
  return NaN;
}

/** 
 * Parses the data contained within the given value and inserts it into the data two-dimensional array starting at the rowIndex. 
 * If the data is to be inserted into a new column, a new header is added to the headers array. The value can be an object, 
 * array or scalar value.
 *
 * If the value is an object, its properties are iterated through and passed back into this function with the name of each 
 * property extending the path. For instance, if the object contains the property "entry" and the path passed in was "/feed",
 * this function is called with the value of the entry property and the path "/feed/entry".
 *
 * If the value is an array containing other arrays or objects, each element in the array is passed into this function with 
 * the rowIndex incremeneted for each element.
 *
 * If the value is an array containing only scalar values, those values are joined together and inserted into the data array as 
 * a single value.
 *
 * If the value is a scalar, the value is inserted directly into the data array.
 */
function parseData_(headers, data, path, state, value, query, options, includeFunc) {
  var dataInserted = false;

  if (Array.isArray(value) && isObjectArray_(value)) {
    for (var i = 0; i < value.length; i++) {
      if (parseData_(headers, data, path, state, value[i], query, options, includeFunc)) {
        dataInserted = true;

        if (data[state.rowIndex]) {
          state.rowIndex++;
        }
      }
    }
  } else if (isObject_(value)) {
    for (key in value) {
      if (parseData_(headers, data, path + "/" + key, state, value[key], query, options, includeFunc)) {
        dataInserted = true; 
      }
    }
  } else if (!includeFunc || includeFunc(query, path, options)) {
    // Handle arrays containing only scalar values
    if (Array.isArray(value)) {
      value = value.join(); 
    }
    
    // Insert new row if one doesn't already exist
    if (!data[state.rowIndex]) {
      data[state.rowIndex] = new Array();
    }
    
    // Add a new header if one doesn't exist
    if (!headers[path] && headers[path] != 0) {
      headers[path] = Object.keys(headers).length;
    }
    
    // Insert the data
    data[state.rowIndex][headers[path]] = value;
    dataInserted = true;
  }
  
  return dataInserted;
}

/** 
 * Parses the headers array and inserts it into the first row of the data array.
 */
function parseHeaders_(headers, data) {
  data[0] = new Array();

  for (key in headers) {
    data[0][headers[key]] = key;
  }
}

/** 
 * Applies the transform function for each element in the data array, going through each column of each row.
 */
function transformData_(data, options, transformFunc) {
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      transformFunc(data, i, j, options);
    }
  }
}

/** 
 * Returns true if the given test value is an object; false otherwise.
 */
function isObject_(test) {
  return Object.prototype.toString.call(test) === '[object Object]';
}

/** 
 * Returns true if the given test value is an array containing at least one object; false otherwise.
 */
function isObjectArray_(test) {
  for (var i = 0; i < test.length; i++) {
    if (isObject_(test[i])) {
      return true; 
    }
  }  

  return false;
}

/** 
 * Returns true if the given query applies to the given path. 
 */
function includeXPath_(query, path, options) {
  if (!query) {
    return true; 
  } else if (Array.isArray(query)) {
    for (var i = 0; i < query.length; i++) {
      if (applyXPathRule_(query[i], path, options)) {
        return true; 
      }
    }  
  } else {
    return applyXPathRule_(query, path, options);
  }
  
  return false; 
};

/** 
 * Returns true if the rule applies to the given path. 
 */
function applyXPathRule_(rule, path, options) {
  return path.indexOf(rule) == 0; 
}

/** 
 * By default, this function transforms the value at the given row & column so it looks more like a normal data import. Specifically:
 *
 *   - Data from parent JSON elements gets inherited to their child elements, so rows representing child elements contain the values 
 *     of the rows representing their parent elements.
 *   - Values longer than 256 characters get truncated.
 *   - Values in row 0 (headers) have slashes converted to spaces, common prefixes removed and the resulting text converted to title 
*      case. 
 *
 * To change this behavior, pass in one of these values in the options parameter:
 *
 *    noInherit:     Don't inherit values from parent elements
 *    noTruncate:    Don't truncate values
 *    rawHeaders:    Don't prettify headers
 *    debugLocation: Prepend each value with the row & column it belongs in
 */
function defaultTransform_(data, row, column, options) {
  if (data[row][column] == null) {
    if (row < 2 || hasOption_(options, "noInherit")) {
      data[row][column] = "";
    } else {
      data[row][column] = data[row-1][column];
    }
  } 

  if (!hasOption_(options, "rawHeaders") && row == 0) {
    if (column == 0 && data[row].length > 1) {
      removeCommonPrefixes_(data, row);  
    }
    
    data[row][column] = toTitleCase_(data[row][column].toString().replace(/[\/\_]/g, " "));
  }
  
  if (!hasOption_(options, "noTruncate") && data[row][column]) {
    data[row][column] = data[row][column].toString().substr(0, 256);
  }

  if (hasOption_(options, "debugLocation")) {
    data[row][column] = "[" + row + "," + column + "]" + data[row][column];
  }
  
  var num = filterFloat(data[row][column]);
  if (!isNaN(num)) {
    data[row][column] = num;
  }
}

/** 
 * If all the values in the given row share the same prefix, remove that prefix.
 */
function removeCommonPrefixes_(data, row) {
  var matchIndex = data[row][0].length;

  for (var i = 1; i < data[row].length; i++) {
    matchIndex = findEqualityEndpoint_(data[row][i-1], data[row][i], matchIndex);

    if (matchIndex == 0) {
      return;
    }
  }
  
  for (var i = 0; i < data[row].length; i++) {
    data[row][i] = data[row][i].substring(matchIndex, data[row][i].length);
  }
}

/** 
 * Locates the index where the two strings values stop being equal, stopping automatically at the stopAt index.
 */
function findEqualityEndpoint_(string1, string2, stopAt) {
  if (!string1 || !string2) {
    return -1; 
  }
  
  var maxEndpoint = Math.min(stopAt, string1.length, string2.length);
  
  for (var i = 0; i < maxEndpoint; i++) {
    if (string1.charAt(i) != string2.charAt(i)) {
      return i;
    }
  }
  
  return maxEndpoint;
}
  

/** 
 * Converts the text to title case.
 */
function toTitleCase_(text) {
  if (text == null) {
    return null;
  }
  
  return text.replace(/\w\S*/g, function(word) { return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase(); });
}

/** 
 * Returns true if the given set of options contains the given option.
 */
function hasOption_(options, option) {
  return options && options.indexOf(option) >= 0;
}

/** 
 * Parses the given string into an object, trimming any leading or trailing spaces from the keys.
 */
function parseToObject_(text) {
  var map     = new Object();
  var entries = (text != null && text.trim().length > 0) ? text.toString().split(",") : new Array();
  
  for (var i = 0; i < entries.length; i++) {
    addToMap_(map, entries[i]);  
  }
  
  return map;
}

/** 
 * Parses the given entry and adds it to the given map, trimming any leading or trailing spaces from the key.
 */
function addToMap_(map, entry) {
  var equalsIndex = entry.indexOf("=");  
  var key         = (equalsIndex != -1) ? entry.substring(0, equalsIndex) : entry;
  var value       = (key.length + 1 < entry.length) ? entry.substring(key.length + 1) : "";
  
  map[key.trim()] = value;
}

/** 
 * Returns the given value as a boolean.
 */
function toBool_(value) {
  return value == null ? false : (value.toString().toLowerCase() == "true" ? true : false);
}

/**
 * Converts the value for the given key in the given map to a bool.
 */
function convertToBool_(map, key) {
  if (map[key] != null) {
    map[key] = toBool_(map[key]);
  }  
}

function getDataFromNamedSheet_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var source = ss.getSheetByName(sheetName);
  
  var jsonRange = source.getRange(1,1,source.getLastRow());
  var jsonValues = jsonRange.getValues();
  
  var jsonText = "";
  for (var row in jsonValues) {
    for (var col in jsonValues[row]) {
      jsonText +=jsonValues[row][col];
    }
  }
  Logger.log(jsonText);
  return JSON.parse(jsonText);
}
