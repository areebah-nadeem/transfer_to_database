const Airtable = require('airtable');



AIRTABLE_API_KEY='patF55CtWdPT4xLGM.cc78d8b02df5e87cf80307e305118bb1ce94b36da8a699fbb0452849ea4cd503'
BASE_ID='appls71BBO4hL6cBx'


// Setup Airtable base
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(BASE_ID);

// Define table names
const companiesTableName = 'Companies';
const leadsTableName = 'Leads';
const dataTableName = 'Data';

async function fetchTableRecords(tableName) {
    const records = [];
    await base(tableName).select().eachPage((pageRecords, fetchNextPage) => {
        records.push(...pageRecords);
        fetchNextPage();
    });
    return records;
}

// Format address safely
function formatAddress(address) {
    return address && typeof address === 'string' ? address.trim() : '';
}

async function insertNewLead(companyName, address, contact) {
    console.log(`Attempting to insert: Name: ${companyName}, Address: ${address}, Phone: ${contact}`);

    // Add delay between API requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        await base(leadsTableName).create([
            {
                fields: {
                    'Name': companyName || '',
                    'Address': formatAddress(address),
                    'Phone': contact || ''
                }
            }
        ]);
        console.log(`Successfully inserted: ${companyName}`);
    } catch (error) {
        console.error(`Failed to insert lead for ${companyName}: ${error.message}`);
    }
}

async function run() {
    try {
        // Fetch all records from the Companies and Leads tables
        const companiesRecords = await fetchTableRecords(companiesTableName);
        const leadsRecords = await fetchTableRecords(leadsTableName);

        // Combine companies and leads names
        const allExistingCompanies = [
            ...new Set([
                ...companiesRecords.map(record => record.get('Name')),
                ...leadsRecords.map(record => record.get('Name'))
            ])
        ];

        // Fetch all records from the Data table
        const dataRecords = await fetchTableRecords(dataTableName);
        const csvData = dataRecords.map(record => ({
            "Name": record.get('Name'),
            "Address": record.get('Address'),
            "Phone": record.get('Phone')
        }));

        // Loop through the data and insert new records if they don't exist
        for (let company of csvData) {
            if (!allExistingCompanies.includes(company['Name'])) {
                await insertNewLead(company['Name'], company['Address'], company['Phone']);
            } else {
                console.log(`Skipped existing company: ${company['Name']}`);
            }
        }
    } catch (error) {
        console.error(`Error running the script: ${error.message}`);
    }
}

// Execute the script
run();
