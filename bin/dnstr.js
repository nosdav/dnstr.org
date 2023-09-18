#!/usr/bin/env node

import axios from 'axios';

const name = process.argv[2]; // Get the first argument

if (!name) {
    console.error("Please provide a name as an argument.");
    process.exit(1);
}

const baseName = name.split('.')[0]; // Extract the base name if provided in the format "melvin.nostr"
const url = `https://nomenexplorer.com/api/name?name=${baseName}`;

axios.get(url)
    .then(response => {
        const webValue = response.data.WEB;
        if (webValue) {
            console.log(webValue);
        } else {
            console.log(`No WEB field found for ${baseName}.`);
        }
    })
    .catch(error => {
        console.error("Error fetching data:", error);
    });

