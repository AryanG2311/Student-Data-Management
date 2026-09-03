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

    // capture raw gender entry for audit & hover tooltips
    const rawGender = normalizedRow.gender !== undefined && normalizedRow.gender !== null
      ? String(normalizedRow.gender).trim()
      : '';

    // normalize gender with strict token matching
    let gender = 'Unknown';
    if (rawGender) {
      const gStr = rawGender
        .replace(/['"]/g, '')
        .trim()
        .toLowerCase();

      if (/^(m|male|man|boy)$/i.test(gStr)) {
        gender = 'Male';
      } else if (/^(f|female|woman|girl)$/i.test(gStr)) {
        gender = 'Female';
      } else {
        gender = 'Unknown';
      }
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

    // detect data quality warnings / anomalies (non-destructive review flags)
    const warnings = [];
    if (gender === 'Unknown') {
      warnings.push(rawGender ? `Unknown Gender (Entered: "${rawGender}")` : 'Missing Gender Entry');
    }
    if (grade === 0) {
      warnings.push('Missing / Unresolved Grade');
    }
    if (!name || name.toLowerCase() === 'unknown' || name.trim() === '') {
      warnings.push('Missing Candidate Name');
    }
    if (total === 0) {
      warnings.push('Zero Total Score');
    }

    const hasWarning = warnings.length > 0;
    const isDebarred = false;

    return {
      name,
      gender,
      rawGender,
      grade,
      math,
      science,
      english,
      total,
      isDebarred,
      hasWarning,
      warnings,
    };
  });
}
