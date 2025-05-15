import fs from 'fs';
import path from 'path';

/**
 * Valide la conformité des tests avec le plan de test
 */
export const validateTestPlan = () => {
  const results = {
    criticalTests: {
      required: ['Login', 'ChatWindow', 'DocumentPreview'],
      found: [],
      missing: []
    },
    securityTests: {
      required: ['authentication', 'encryption', 'tokens'],
      found: [],
      missing: []
    },
    coverage: {
      required: 80,
      actual: 0
    }
  };

  // Vérifier les fichiers de test
  const testFiles = findTestFiles('__tests__');
  testFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Vérifier les composants critiques
    results.criticalTests.required.forEach(component => {
      if (content.includes(component)) {
        results.criticalTests.found.push(component);
      }
    });

    // Vérifier les tests de sécurité
    results.securityTests.required.forEach(security => {
      if (content.includes(security)) {
        results.securityTests.found.push(security);
      }
    });
  });

  // Calculer les manques
  results.criticalTests.missing = results.criticalTests.required.filter(
    component => !results.criticalTests.found.includes(component)
  );
  results.securityTests.missing = results.securityTests.required.filter(
    security => !results.securityTests.found.includes(security)
  );

  return results;
};

/**
 * Trouve tous les fichiers de test récursivement
 */
const findTestFiles = (dir) => {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findTestFiles(filePath));
    } else if (file.endsWith('.test.js')) {
      results.push(filePath);
    }
  });

  return results;
};

/**
 * Vérifie la couverture des tests
 */
export const checkTestCoverage = (coverageResults) => {
  const { total } = coverageResults;
  return {
    statements: total.statements.pct >= 80,
    branches: total.branches.pct >= 80,
    functions: total.functions.pct >= 80,
    lines: total.lines.pct >= 80
  };
}; 