const form = document.getElementById("form") as HTMLFormElement | null;
const result = document.getElementById("result");

if (form && result) {
	form.addEventListener("submit", (e: SubmitEvent) => {
		e.preventDefault();

		const formData = new FormData(form);
		const json = JSON.stringify(Object.fromEntries(formData));

		result.innerHTML = "Bitte warten...";
		result.style.display = "";

		fetch("https://api.web3forms.com/submit", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: json,
		})
			.then(async (response) => {
				const data = await response.json();
				result.innerHTML = response.ok
					? data.message
					: "Ups, das hat nicht geklappt...";
			})
			.catch(() => {
				result.innerHTML = "Ups, das hat nicht geklappt...";
			})
			.finally(() => {
				form.reset();
				setTimeout(() => {
					result.style.display = "none";
				}, 3000);
			});
	});
}
