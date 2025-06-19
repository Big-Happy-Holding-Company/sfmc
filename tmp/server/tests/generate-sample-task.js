"use strict";
/**
 * Generate a sample task for demonstration
 *
 * This script directly uses the TaskFactory to generate a sample task
 * and save it to a JSON file.
 *
 * @author Cascade
 */
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var task_factory_1 = require("../tools/task-factory");
var validators_1 = require("../templates/validators");
// Create instances of TaskFactory and TaskValidator
var factory = new task_factory_1.TaskFactory();
var validator = new validators_1.TaskValidator();
// Generate a task with the COM category and horizontal_reflection transformation
var task = factory.generateTask('COM', 'horizontal_reflection');
if (!task) {
    console.error('Failed to generate task');
    process.exit(1);
}
// Validate the generated task
var validationResult = validator.validateTask(task);
if (!validationResult.isValid) {
    console.error('Generated task is invalid:');
    validationResult.errors.forEach(function (error) { return console.error("  - ".concat(error)); });
    process.exit(1);
}
// Output the task
var outputPath = path_1.default.join(__dirname, '../data/tasks/COM-100.json');
var taskJson = JSON.stringify(task, null, 2);
// Ensure directory exists
var dir = path_1.default.dirname(outputPath);
if (!fs_1.default.existsSync(dir)) {
    fs_1.default.mkdirSync(dir, { recursive: true });
}
// Write to file
fs_1.default.writeFileSync(outputPath, taskJson);
console.log("Task generated and saved to ".concat(outputPath));
console.log('\nTask Content:');
console.log(taskJson);
