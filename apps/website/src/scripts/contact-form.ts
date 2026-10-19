const form = document.getElementById("form") as HTMLFormElement | null;
const result = document.getElementById("result");

const ERROR_MESSAGE =
	"Ups, das hat nicht geklappt. Deine Nachricht ist noch im Formular – versuch es gleich nochmal oder schreib uns an hey@shroom-mates.de.";

if (form && result) {
	// Themen-Chips: echte <button aria-pressed>, genau ein Thema (oder keins).
	// Der Wert landet im versteckten Feld „topic“ und geht mit ab.
	const topicInput = form.querySelector<HTMLInputElement>(
		'input[name="topic"]',
	);
	const chips = Array.from(
		form.querySelectorAll<HTMLButtonElement>("[data-topic]"),
	);

	const selectTopic = (selected: HTMLButtonElement | null) => {
		for (const chip of chips) {
			chip.setAttribute("aria-pressed", String(chip === selected));
		}
		if (topicInput) topicInput.value = selected?.dataset.topic ?? "";
	};

	for (const chip of chips) {
		chip.addEventListener("click", () => {
			const isPressed = chip.getAttribute("aria-pressed") === "true";
			selectTopic(isPressed ? null : chip);
		});
	}

	form.addEventListener("submit", async (e: SubmitEvent) => {
		e.preventDefault();

		const data = Object.fromEntries(new FormData(form));
		// Leeres Thema nicht mitschicken
		if (!data.topic) delete data.topic;
		const json = JSON.stringify(data);

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
			selectTopic(null);
			setTimeout(() => {
				result.style.display = "none";
			}, 5000);
		} else {
			// Keep the error visible and the user's text in place.
			result.textContent = ERROR_MESSAGE;
		}
	});
}
