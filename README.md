# Import AT Internet data to Google Sheets
This script aims at allowing you to import AT Internet data to Google Sheets.

## Installation
In order to install it, follow these steps:

 1. Open your Google Sheet, and go to *Tools > Script editor...*
 2. Create a new script (*File > New > Script file*) and paste the code from *atinternet.gs* to it, and save the script
 3. Go back to your sheet (it should reload). You should see a new menu on top (next to *Accessibility*), called **AT Internet**
 4. Click on *AT Internet > Login*, you'll get permission alerts - accept it, and connect to your Google account (this is because the authentication data are linked to your Google account)
 5. Enter your AT Internet email and password when prompted, and confirm

You are now connected to your AT Internet account on this Google sheet.
In order to logout, just click on *AT Internet > Logged in as ...*

## Usage
In any cell of your sheet (this will be the top-left cell of the imported data table), use this formula:

    =ImportATInternetBasicAuth("YOUR API URL")

Example:

    =ImportATInternetBasicAuth("https://apirest.atinternet-solutions.com/data/v2/json/getData?columns={d_source_global,m_visits}&sort={-m_visits}&space={s:123456}&period={R:{D:%27-1%27}}&max-results=500&page-num=1")

