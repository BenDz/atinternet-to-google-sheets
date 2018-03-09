# Import AT Internet data to Google Sheets

This script aims at allowing you to import AT Internet data to Google Sheets.

## Installation

In order to install it, follow these steps:

1.  Open your Google Sheet, and go to _Tools > Script editor..._
2.  Create a new script (_File > New > Script file_) and paste the code from _atinternet.gs_ to it, and save the script
3.  Go back to your sheet and reload it. You should see a new menu on top (next to _Accessibility_), called **AT Internet**
4.  Click on _AT Internet > Login_, you'll get permission alerts - accept it, and connect to your Google account (this is because the authentication data are linked to your Google account)
5.  Enter your AT Internet email and password when prompted, and confirm

You are now connected to your AT Internet account on this Google sheet.
In order to logout, just click on _AT Internet > Logged in as ..._

## Usage

In any cell of your sheet (this will be the top-left cell of the imported data table), you can add a request through two ways:

### Menu

1.  Go to _AT Internet > Add a request in the current cell_
2.  Paste your API URL in the prompt

### Formula

Use this formula:

    =ImportATInternetBasicAuth("YOUR API URL")

Example:

    =ImportATInternetBasicAuth("https://apirest.atinternet-solutions.com/data/v2/json/getData?columns={d_source_global,m_visits}&sort={-m_visits}&space={s:123456}&period={R:{D:%27-1%27}}&max-results=500&page-num=1")
