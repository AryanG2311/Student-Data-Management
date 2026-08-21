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

  if (parsed.errors && parsed.errors.length > 0) {
    console.warn("PapaParse parsing errors occurred:", parsed.errors);
  }

  const rows = parsed.data;

  return rows.map((row) => {
    // Normalize keys in case of leading/trailing spaces or varied capitalization
    const normalizedRow = {};
    for (const key of Object.keys(row)) {
      const kLow = key.trim().toLowerCase();
      if (kLow.includes('name')) {
        normalizedRow.name = row[key];
      } else if (kLow.includes('gender')) {
        normalizedRow.gender = row[key];
      } else if (kLow.includes('grade')) {
        normalizedRow.grade = row[key];
      } else if (kLow.includes('math')) {
        normalizedRow.math = row[key];
      } else if (kLow.includes('science')) {
        normalizedRow.science = row[key];
      } else if (kLow.includes('english')) {
        normalizedRow.english = row[key];
      }
    }

    // 1. Name Standardization: strip quotes, apostrophes, format to Title Case
    let name = '';
    if (normalizedRow.name !== undefined && normalizedRow.name !== null) {
      name = String(normalizedRow.name)
        .replace(/['"]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    // 2. Gender Normalization: strictly "Male" or "Female", ignore numeric noise like 0 or 1
    let gender = 'Unknown';
    if (normalizedRow.gender !== undefined && normalizedRow.gender !== null) {
      const gStr = String(normalizedRow.gender).trim().toLowerCase();
      if (gStr.startsWith('m')) {
        gender = 'Male';
      } else if (gStr.startsWith('f')) {
        gender = 'Female';
      }
    }

    // 3. Grade Extraction: extract integer (handles noise like "0 Grade 11" -> 11)
    let grade = 0;
    if (normalizedRow.grade !== undefined && normalizedRow.grade !== null) {
      const gStr = String(normalizedRow.grade).trim();
      const matches = gStr.match(/\d+/g);
      if (matches && matches.length > 0) {
        grade = parseInt(matches[matches.length - 1], 10);
      }
    }

    // 4. Subject Scores Extraction: extract digits/decimals, fill empty with 0
    const cleanScore = (val) => {
      if (val === undefined || val === null || String(val).trim() === '') {
        return 0;
      }
      const sStr = String(val).trim();
      const match = sStr.match(/\d+(?:\.\d+)?/);
      return match ? parseFloat(match[0]) : 0;
    };

    const math = cleanScore(normalizedRow.math);
    const science = cleanScore(normalizedRow.science);
    const english = cleanScore(normalizedRow.english);

    // 5. Total Calculation: strictly recalculate sum
    const total = math + science + english;

    // 6. Status initialization
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
