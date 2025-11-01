function isMobile() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);
}

function copyToClipboard(text) {
	var textarea = document.createElement("textarea");
	textarea.value = text;
	document.body.appendChild(textarea);
	textarea.select();
	document.execCommand("copy");
	document.body.removeChild(textarea);
}

document.addEventListener("DOMContentLoaded", function () {
	if (isMobile()) {
		document.querySelector(".btn-phone").style.display = "inline-block";
		var phoneButton = document.querySelector(".btn-phone");
		phoneButton.addEventListener("click", function () {
			var phoneNumber = "123-456-7890";
			copyToClipboard(phoneNumber);
			alert("Copied to clipboard");
		});
	} else {
		document.querySelector(".btn-copy").style.display = "inline-block";
		var copyButton = document.querySelector(".btn-copy");
		copyButton.addEventListener("click", function () {
			var phoneNumber = "123-456-7890";
			copyToClipboard(phoneNumber);
			alert("Copied to clipboard");
		});
	}
});
