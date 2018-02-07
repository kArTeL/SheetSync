
const functions = require('firebase-functions');
const google = require('googleapis');
const _ = require('lodash');
const sheets = google.sheets('v4')

//https://docs.google.com/spreadsheets/d/1Dq9KKRAcadmSDTwWDPICkkDbMOYrZqNvCrVx7fD1pDI/edit#gid=0
const spreadsheetId = '1Dq9KKRAcadmSDTwWDPICkkDbMOYrZqNvCrVx7fD1pDI'

const serviceAccount = require('./client_secret_800877605555-6qld7s455v4n6od5hm9ot0luavaatqn8.apps.googleusercontent.com.json')
const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/spreadsheets'], // read and write sheets
    null
);

const jwtAuthPromise = new Promise((resolve, reject) => {
    jwtClient.authorize((err, tokens) => {
        console.info("Tokens", tokens)
        if (err) {
          console.error(err)
          reject(err)
          return
        }
        resolve(tokens)
    });
});

exports.copyScoresToSheet = functions.database.ref('/scores').onUpdate(event => {
    const data = event.data.val();
    console.info(data);

    // Sort the scores.  scores is an array of arrays each containing name and score.
    const scores = _.map(data, (value, key) => [String(key), value]);
    scores.sort((a,b) => {return b[1] - a[1]});

    return jwtAuthPromise.then(tokens => {
        return new Promise((resolve, reject) => {
            sheets.spreadsheets.values.update({
                auth: jwtClient,
                spreadsheetId: spreadsheetId,
                range: 'Scores!A2:B7',  // update this range of cells
                valueInputOption: 'RAW',
                resource: { values: scores }
            }, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return
                }
                console.log(result);
                resolve(result);
            });
        });
    });
});