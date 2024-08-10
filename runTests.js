const fs = require('fs');  // File system module to write to files
const xlsx = require('xlsx');
const wdio = require('appium-webdriverio');
const winston = require('winston');  // Logging library

// Set up Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'testResults.log' })
  ]
});

// Function to load configuration from JSON file
function loadConfig() {
  try {
      const fileContents = fs.readFileSync('./config.json', 'utf8');
      const config = JSON.parse(fileContents);
      return config;
  } catch (e) {
      console.error('Error loading config file:', e);
  }
}

// Example usage
const config = loadConfig();
console.log("Device Model: ", config.device.model);
console.log("Server URL: ", config.test_environment.server_url);

// Parse each sheet into an array of Test Statements
const testCases = {};
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  // Organize Test Statements by Test Case ID
  rows.forEach(row => {
    if (!testCases[row['Test Case ID']]) {
      testCases[row['Test Case ID']] = [];
    }
    testCases[row['Test Case ID']].push(row);
  });
});

// Set up Appium and the JavaScript client
const opts = {
  path: '/wd/hub',
  port: 4723,
  capabilities: {
    platformName: 'Android',
    deviceName: 'Android Emulator',
    app: '/path/to/your/app.apk', // Replace with your app path
    automationName: 'UiAutomator2'
  }
};

let totalTestCases = 0;
let passedTestCases = 0;
let failedTestCases = 0;

let resultsPerDevice = {};

let results = {};  // Object to store test results

const preDefinedCommands = {
  click: async (element) => {
    await element.click();
    console.log("Element clicked");
},
  scroll: async (element) => {
    await element.scrollIntoView();
    console.log("Scrolled to element");
  },
  inputText: async (element, text) => {
    await element.setValue(text);
    console.log(`Text "${text}" entered into element`);
  },
  getText: async (element) => {
    const text = await element.getText();
    console.log(`Text retrieved from element: "${text}"`);
    return text;
  },
  verifyText: async (element, expectedText) => {
      const actualText = await element.getText();
      if (actualText !== expectedText) {
          throw new Error(`Text mismatch: expected ${expectedText}, got ${actualText}`);
      }
  }
  // Add more pre-defined commands as needed
};

let userDefinedCommands = {};

function addUserDefinedCommand(name, func) {
    userDefinedCommands[name] = func;
}

// Example of adding a user-defined command
addUserDefinedCommand('customClick', async (element) => {
    console.log('Executing custom click');
    await element.click();
});

async function executeCommand(command, element, ...args) {
  if (preDefinedCommands[command]) {
      await preDefinedCommands[command](element, ...args);
  } else if (userDefinedCommands[command]) {
      await userDefinedCommands[command](element, ...args);
  } else {
      throw new Error(`Unknown command: ${command}`);
  }
}

async function runTestSuite() {
  const client = await wdio.remote(opts); // Initialize WebDriverIO with Appium

  // Initialize or reset counters for each device
  resultsPerDevice[deviceName] = {
    totalTestCases: 0,
    passedTestCases: 0,
    failedTestCases: 0,
  };

  // Example test case for inputting text
  const usernameField = await client.$("com.example.app:id/username");
  await executeCommand('inputText', usernameField, "testUser");

  // Example test case for retrieving and validating text
  const welcomeText = await client.$("//android.widget.TextView[@text='Welcome']");
  const retrievedText = await executeCommand('getText', welcomeText, "Welcome");

  for (const testCaseId in testCases) {
    console.log(`Executing Test Case: ${testCaseId}`);
    logger.info(`Executing Test Case: ${testCaseId}`);
    const statements = testCases[testCaseId];
    resultsPerDevice[deviceName].totalTestCases++;
    let testCasePassed = true;
    let testCaseResults = {};

    for (const statement of statements) {
      const { Action, LocatorType, LocatorValue, TestData, ExpectedResult, TestCaseName } = statement;
      console.log(`Executing Test Statement: ${TestCaseName} - ${Action}`);
      logger.info(`Executing Test Statement: ${TestCaseName} - ${Action}`);

      try {
        const element = await client.$(`${LocatorType}=${LocatorValue}`);
        await executeCommand(Action, element, TestData);
        console.log(`Test Statement ${TestCaseName} passed`);

        if (Action === 'click') {
          await element.click();
        } else if (Action === 'scroll') {
          await element.scroll();
        } else if (Action === 'inputText') {
          await element.inputText(text);
        } else if (Action === 'verifyText') {
          await element.verifyText(expectedText);
        } else if (Action === 'installAPK') {
          await element.installAPK(TestData);
        } else if (Action === 'uninstallAPK') {
          await element.uninstallAPK(TestData);
        } else if (Action === 'takeScreenshot') {
          await element.takeScreenshot(TestData);
        } else if (Action === 'performOCR') {
          await element.performOCR(TestData);
        } else if (Action === 'assert') {
          const actualText = await element.getText();
          // Add additional actions as needed (e.g., swipe, scroll, etc.)

          // Adding validation to compare Actual Result with Expected Result
          // This requires extending the script to capture actual results and compare them
          if (actualText !== ExpectedResult) {
            console.error(`Assertion Failed: Expected ${ExpectedResult}, but got ${actualText}`);
            logger.error(`Assertion Failed: Expected ${ExpectedResult}, but got ${actualText}`);
            testCasePassed = false;
          } else {
            console.log(`Assertion Passed`);
            logger.info(`Assertion Passed`);
          }
        }

        // Store individual statement result
        testCaseResults[TestCaseName] = {
          action: Action,
          passed: true,
          actualResult: actualText || '',
          expectedResult: ExpectedResult || ''
        };

      } catch (error) {
        console.error(`Test Statement ${TestCaseName} failed: ${error.message}`);
        logger.error(`Error executing statement: ${error.message}`);
        testCasePassed = false;

        // Store failed statement result
        testCaseResults[TestCaseName] = {
          action: Action,
          passed: false,
          error: error.message
        };
      }
    }

    // Store the result for this test case
    results[testCaseId] = {
      passed: testCasePassed,
      statements: testCaseResults
    };

    if (testCasePassed) {
      passedTestCases++;
    } else {
      failedTestCases++;
    }

    logger.info(`Test Case ${testCaseId} ${testCasePassed ? 'PASSED' : 'FAILED'}`);
  }

  console.log(`Results for Device: ${deviceName}`);
  console.log(`Total Test Cases: ${resultsPerDevice[deviceName].totalTestCases}`);
  console.log(`Passed Test Cases: ${resultsPerDevice[deviceName].passedTestCases}`);
  console.log(`Failed Test Cases: ${resultsPerDevice[deviceName].failedTestCases}`);

  // Log summary results
  logger.info('Test suite execution completed.');
  await client.deleteSession(); // Clean up the session
}

// Load the Excel file and run the Test Suite
const workbook = xlsx.readFile('Test-Suite-ADB.xlsx');
runTestSuite().catch(err => logger.error(err));



      

  