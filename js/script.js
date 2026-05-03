/**
 * Utility to check if the current device is a mobile device.
 * @returns {boolean} True if mobile, false otherwise.
 */
function isMobileDevice() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent,
	);
}

/**
 * Utility to check if the current device is iOS.
 * @returns {boolean} True if iOS, false otherwise.
 */
function isIOSDevice() {
	return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Utility to check if the current device is Android.
 * @returns {boolean} True if Android, false otherwise.
 */
function isAndroidDevice() {
	return /Android/i.test(navigator.userAgent);
}

/**
 * Copies the given text to the clipboard.
 * @param {string} text - The text to copy.
 */
function copyToClipboard(text) {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard
			.writeText(text)
			.catch((err) => console.error("Clipboard copy failed:", err));
	} else {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand("copy");
		document.body.removeChild(textarea);
	}
}

document.addEventListener("DOMContentLoaded", function () {
	const phoneBtn = document.getElementById("phone-btn");
	const locationBtn = document.querySelector(".btn-location");

	if (phoneBtn) {
		const phoneNumber = phoneBtn.textContent.trim();
		phoneBtn.addEventListener("click", function (e) {
			if (isMobileDevice()) {
				// On mobile → open dialer
				window.location.href = `tel:${phoneNumber}`;
			} else {
				// On desktop → copy to clipboard
				e.preventDefault(); // prevent navigation
				copyToClipboard(phoneNumber);
				alert(`Phone number ${phoneNumber} copied to clipboard.`);
			}
		});
	}

	if (locationBtn) {
		const address = locationBtn.textContent.trim();
		let mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

		if (isIOSDevice()) {
			mapLink = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
		} else if (isAndroidDevice()) {
			mapLink = `geo:0,0?q=${encodeURIComponent(address)}`;
		}
		locationBtn.setAttribute("href", mapLink);
	}
});
