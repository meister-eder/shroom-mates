const form = document.getElementById("form") as HTMLFormElement | null;
const result = document.getElementById("result");

const ERROR_MESSAGE =
	"Ups, das hat nicht geklappt. Deine Nachricht ist noch im Formular – versuch es gleich nochmal oder schreib uns an hey@shroom-mates.de.";

if (form && result) {
	form.addEventListener("submit", async (e: SubmitEvent) => {
		e.preventDefault();

		const json = JSON.stringify(Object.fromEntries(new FormData(form)));

		result.textContent = "Bitte warten...";
		result.style.display = "";

		let ok = false;
		try {
			const response = await fetch("https://api.web3forms.com/submit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: json,
			});
			ok = response.ok;
		} catch {
			ok = false;
		}

		if (ok) {
			// Only clear the form once the message was actually sent.
			result.textContent = "Danke! Deine Nachricht ist bei uns angekommen.";
			form.reset();
			setTimeout(() => {
				result.style.display = "none";
			}, 5000);
		} else {
			// Keep the error visible and the user's text in place.
			result.textContent = ERROR_MESSAGE;
		}
	});
}
