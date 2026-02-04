import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, 'rpi_prices.csv');
const JSON_FILE = path.join(__dirname, 'dataset_rpi.json');

const MONTHS = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
};

function parseDateHeader(header) {
    const match = header.match(/^([a-zA-Z]+)-(\d+)/);
    if (!match) return null;
    const month = MONTHS[match[1]];
    const year = '20' + match[2];
    if (!month) return null;
    return `${year}-${month}-01`;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function cleanPrice(price) {
    if (!price || price === '' || price === '$' || price === 'null') return null;
    const cleaned = price.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

try {
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`Error: ${CSV_FILE} does not exist.`);
        process.exit(1);
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length < 2) {
        console.error('Error: CSV file is empty or missing headers.');
        process.exit(1);
    }

    const headers = parseCSVLine(lines[0]);

    // Identify static columns and date columns
    const nameIdx = headers.indexOf('Name');
    const ramIdx = headers.indexOf('RAM (MB)');
    const emmcIdx = headers.indexOf('eMMC (GB)');
    const dramIdx = headers.indexOf('DRAM');
    const skuIdx = headers.indexOf('SKU');
    const eanIdx = headers.indexOf('EAN');

    const dateMapping = [];
    for (let i = 0; i < headers.length; i++) {
        const dateStr = parseDateHeader(headers[i]);
        if (dateStr) {
            dateMapping.push({ index: i, date: dateStr });
        }
    }

    // Sort mappings chronologically to find the range and fill gaps
    dateMapping.sort((a, b) => a.date.localeCompare(b.date));

    if (dateMapping.length === 0) {
        console.error('Error: No date columns found in CSV.');
        process.exit(1);
    }

    const minDate = dateMapping[0].date;
    const maxDate = dateMapping[dateMapping.length - 1].date;

    function getNextMonth(dateStr) {
        const [year, month] = dateStr.split('-').map(Number);
        let nextMonth = month + 1;
        let nextYear = year;
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }
        return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    }

    const allMonths = [];
    let currentM = minDate;
    while (currentM <= maxDate) {
        allMonths.push(currentM);
        currentM = getNextMonth(currentM);
    }

    let result = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;

        const priceMap = {};
        for (const mapping of dateMapping) {
            priceMap[mapping.date] = cleanPrice(values[mapping.index]);
        }

        const entry = {
            NAME: values[nameIdx] || '',
            RAM: parseInt(values[ramIdx]) / 1024 || null,
            EMMC: parseInt(values[emmcIdx]) === 0 ? 0 : (parseInt(values[emmcIdx]) || null),
            DRAM_TYPE: values[dramIdx] || '',
            SKU: values[skuIdx] || '',
            EAN: values[eanIdx] || '',
            USD: [],
            DATE: []
        };

        let lastPrice = null;
        const entryUSD = [];
        const entryDATE = [];

        // Forward-fill chronological values
        for (const month of allMonths) {
            const currentPrice = priceMap[month];
            if (currentPrice !== undefined && currentPrice !== null) {
                lastPrice = currentPrice;
            }
            entryUSD.push(lastPrice);
            entryDATE.push(month);
        }

        // Store reverse-chronological (Newest First) per UI requirement
        entry.USD = entryUSD.reverse();
        entry.DATE = entryDATE.reverse();

        result.push(entry);
    }

    // filter out Pi 1,2,3
    result = result.filter(entry => !entry.NAME.includes('Pi 1') && !entry.NAME.includes('Pi 2'));

    result.sort((a, b) => {
        const nameA = a.NAME.toLowerCase();
        const nameB = b.NAME.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    fs.writeFileSync(JSON_FILE, JSON.stringify(result, null, 2));
    console.log(`Successfully created ${JSON_FILE} with ${result.length} entries.`);

} catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
}
