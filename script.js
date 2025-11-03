document.addEventListener("DOMContentLoaded", function () {
	const phoneBtn = document.getElementById("phone-btn");
	const phoneNumber = phoneBtn.textContent.trim();
	const locationBtn = document.querySelector(".btn-location");

	function isMobile() {
		return (
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			)
		);
	}

	function isIOS() {
		return /iPhone|iPad|iPod/i.test(navigator.userAgent);
	}

	function isAndroid() {
		return /Android/i.test(navigator.userAgent);
	}

	function copyToClipboard(text) {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand("copy");
		document.body.removeChild(textarea);
	}

	phoneBtn.addEventListener("click", function (e) {
		if (isMobile()) {
			// On mobile → open dialer
			window.location.href = `tel:${phoneNumber}`;
		} else {
			// On desktop → copy to clipboard
			copyToClipboard(phoneNumber);
			alert(`Phone number ${phoneNumber} copied to clipboard.`);
			e.preventDefault(); // prevent navigation
		}
	});

	if (locationBtn) {
		const address = locationBtn.textContent.trim();
		let mapLink = "";

		if (isIOS()) {
			mapLink = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
		}
		else if (isAndroid()) {
			mapLink = `geo:0,0?q=${encodeURIComponent(address)}`;
		}
		else {
			mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
		}
		locationBtn.setAttribute("href", mapLink);
	}
});