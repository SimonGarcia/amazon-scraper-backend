/* eslint-disable */

import * as functions from "firebase-functions";
import { adminDb } from './firebaseAdmin';
//import * as admin from 'firebase-admin'


// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//

const fetchResults:any = async (id: string) => {
    const api_key = process.env.BRIGHTDATA_API_KEY;
    const res = await fetch(`https://api.brightdata.com/dca/dataset?id=${id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${api_key}`,
        }
    })

    const data = await res.json();
    console.log("DEBUG 1");
    
    if (data.status === "building" || data.status === "collecting") {
        console.log("NOT COMPLETE YET, TRY AGAIN...");
        return fetchResults(id);
        
    }
    console.log("DEBUG 2");
    return data;
}

export const onScraperComplete = functions.https.onRequest( async (request, response) => {
    console.log("SCRAPE COMPLETE >>>:", request.body);
    
    const { success, id, finished } = request.body;

    if (!success) {
        await adminDb.collection('searches').doc(id).set({
            status: "error",
            updateAt: finished,
        }, {
            merge: true,
        })
    }

    const data = await fetchResults(id);

    await adminDb.collection('searches').doc(id).set({
        status: "complete",
        updateAt: finished,
        results: data,
    }, {
        merge: true
    })

    console.log('WOOOOHOOOOO FULL CIRCLE');
    
    response.send("Scraping function finished!");
});


//  https://36f7-2600-1700-a0b0-1520-1cb3-3c35-bd3-1145.ngrok.io/web-scraper-263b9/us-central1/onScraperComplete