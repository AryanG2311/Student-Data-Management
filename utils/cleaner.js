import Papa from 'papaparse';

/**
 * Clean CSV raw data client-side using PapaParse and Javascript Regex.
 * Implements identical cleaning rules to the Python Pandas backend.
 * 
 * @param {string} csvString - The raw CSV file contents
 * @returns {Array<Object>} - Cleaned array of student objects
 */
export function cleanCSV(csvString) {
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors?.length > 0) {
    console.warn("PapaParse parsing errors occurred:", parsed.errors);
  }

  const rows = parsed.data;

  return rows.map((row) => {
    // normalize keys to lowercase and trim spaces
    const normalizedRow = {};
    for (const key of Object.keys(row)) {
      const kLow = key.trim().toLowerCase();
      if (kLow.includes('name')) normalizedRow.name = row[key];
      else if (kLow.includes('gender')) normalizedRow.gender = row[key];
      else if (kLow.includes('grade')) normalizedRow.grade = row[key];
      else if (kLow.includes('math')) normalizedRow.math = row[key];
      else if (kLow.includes('science')) normalizedRow.science = row[key];
      else if (kLow.includes('english')) normalizedRow.english = row[key];
    }

    // format names
    let name = '';
    if (normalizedRow.name) {
      name = String(normalizedRow.name)
        .replace(/['"]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    // normalize gender
    let gender = 'Unknown';
    if (normalizedRow.gender) {
      const gStr = String(normalizedRow.gender).trim().toLowerCase();
      if (gStr.startsWith('m')) gender = 'Male';
      if (gStr.startsWith('f')) gender = 'Female';
    }

    // extract grade integer
    let grade = 0;
    if (normalizedRow.grade) {
      const matches = String(normalizedRow.grade).trim().match(/\d+/g);
      if (matches?.length > 0) {
        grade = parseInt(matches[matches.length - 1], 10);
      }
    }

    // parse scores
    const cleanScore = (val) => {
      if (!val || String(val).trim() === '') return 0;
      const match = String(val).trim().match(/\d+(?:\.\d+)?/);
      return match ? parseFloat(match[0]) : 0;
    };

    const math = cleanScore(normalizedRow.math);
    const science = cleanScore(normalizedRow.science);
    const english = cleanScore(normalizedRow.english);

    // sum score total
    const total = math + science + english;

    // set default debarred state
    const isDebarred = false;

    return {
      name,
      gender,
      grade,
      math,
      science,
      english,
      total,
      isDebarred,
    };
  });
}
