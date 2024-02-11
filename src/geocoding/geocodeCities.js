const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Set the AWS region
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });

// Create an Amazon Location Service client
const location = new AWS.Location();

// Function to geocode a city using Amazon Location Service
const geocodeCity = async (city, state) => {
  const params = {
    IndexName: 'CitiesGeocodeIndex', // Replace with your place index name
    Text: `${city}, ${state}`, // Combine city and state for geocoding
  };

  try {
    const response = await location.searchPlaceIndexForText(params).promise();
    return response.Results[0].Place.Geometry.Point; // Return the first result's point geometry
  } catch (error) {
    console.error(`Error geocoding ${city}, ${state}:`, error);
    return null;
  }
};

// Function to read, geocode, and write city data
const processFiles = async () => {
  const inputDir = path.join(__dirname, '../../data/input');
  const outputDir = path.join(__dirname, '../../data/output');

  // Read all files from the input directory
  const files = fs.readdirSync(inputDir);
  for (const file of files) {
    // Read the input file
    const data = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf8'));

    // Process each city entry
    for (const entry of data) {
      const geocode = await geocodeCity(entry.city, entry.state);
      if (geocode) {
        entry.location = { lat: geocode[1], lon: geocode[0] }; // Assign geocode results to entry
      }
    }

    // Write the geocoded data to the output directory
    const outputFilePath = path.join(outputDir, file.replace('input', 'output'));
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Processed and wrote geocoded data to ${outputFilePath}`);
  }
};

processFiles().then(() => console.log('All files have been processed.'));