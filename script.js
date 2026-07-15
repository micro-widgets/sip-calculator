function calculateSIP() {
    // 1. Extract inputs from DOM
    const P = parseFloat(document.getElementById('monthlyInstalment').value);
    const annualRate = parseFloat(document.getElementById('expectedReturn').value);
    const timeValue = parseFloat(document.getElementById('timePeriod').value);
    const timeUnit = document.getElementById('timeUnit').value;

    // SRE Guard rails
    if (isNaN(P) || isNaN(annualRate) || isNaN(timeValue) || P <= 0 || annualRate <= 0 || timeValue <= 0) {
        alert("Please enter valid positive numbers in all fields.");
        return;
    }

    // 2. Determine total months dynamically based on the dropdown unit
    let n;
    if (timeUnit === 'years') {
        n = timeValue * 12; // Convert years to months
    } else {
        n = timeValue;      // Already in months
    }

    const i = (annualRate / 12) / 100; // Monthly interest rate

    // 3. Execute the compound annuity math
    const futureValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const totalInvested = P * n;
    const wealthGained = futureValue - totalInvested;

    // 4. Update UI with formatted values
    const indianCurrencyFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    document.getElementById('totalInvested').innerText = indianCurrencyFormat.format(totalInvested);
    document.getElementById('wealthGained').innerText = indianCurrencyFormat.format(wealthGained);
    document.getElementById('futureValue').innerText = indianCurrencyFormat.format(futureValue);
}

window.onload = calculateSIP;
