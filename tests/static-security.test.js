const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repositoryRoot = path.join(__dirname, "..");

function read(relativePath) {
	return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

test("login does not persist credentials in localStorage", () => {
	const loginPage = read("login.html");
	const authScript = read("js/auth.js");

	assert.doesNotMatch(loginPage, /localStorage/);
	assert.doesNotMatch(authScript, /localStorage\.setItem/);
	assert.match(authScript, /localStorage\.removeItem\("devUsername"\)/);
	assert.match(authScript, /localStorage\.removeItem\("devPassword"\)/);
	assert.match(authScript, /sessionStorage/);
});

test("both dashboard pages enforce the session guard", () => {
	for (const pagePath of [
		"dashboard/hub.html",
		"dashboard/dashboard.html",
	]) {
		const page = read(pagePath);
		assert.match(page, /class="auth-check"/);
		assert.match(page, /FadaAuth\.startGuard/);
	}
});

test("payslip output does not use HTML-string insertion", () => {
	const calculationScript = read("js/payrollcalculation.js");

	assert.doesNotMatch(calculationScript, /innerHTML/);
	assert.match(calculationScript, /employee\.textContent = employeeName/);
});

test("login and dashboard pages declare a mobile viewport", () => {
	for (const pagePath of [
		"login.html",
		"dashboard/hub.html",
		"dashboard/dashboard.html",
	]) {
		assert.match(read(pagePath), /name="viewport"/);
	}
});
