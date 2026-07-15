// Tab Navigation
class TabManager {
    constructor() {
        this.setupTabListeners();
    }

    setupTabListeners() {
        document.querySelectorAll('.nav-item').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(button.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }
}

// SIP Calculator
class SIPCalculator {
    constructor() {
        this.form = document.getElementById('sipForm');
        this.resultsDiv = document.getElementById('sipResults');
        this.errorDiv = document.getElementById('sipError');
        this.chart = null;

        this.form.addEventListener('submit', (e) => this.handleCalculate(e));
    }

    handleCalculate(e) {
        e.preventDefault();
        this.clearError();

        try {
            const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value);
            const returnRate = parseFloat(document.getElementById('returnRate').value);
            const timePeriod = parseFloat(document.getElementById('timePeriod').value);
            const timeUnit = document.getElementById('timeUnit').value;

            if (!monthlyInvestment || monthlyInvestment < 100) {
                this.showError('Monthly investment must be at least ₹100');
                return;
            }

            if (!returnRate || returnRate < 0 || returnRate > 100) {
                this.showError('Return rate must be between 0% and 100%');
                return;
            }

            if (!timePeriod || timePeriod < 1) {
                this.showError('Time period must be at least 1');
                return;
            }

            const months = timeUnit === 'years' ? timePeriod * 12 : timePeriod;
            const result = this.calculateSIP(monthlyInvestment, returnRate, months);

            this.displayResults(result, monthlyInvestment, returnRate, months);
            this.resultsDiv.classList.remove('hidden');
        } catch (error) {
            this.showError('An error occurred. Please check your inputs.');
        }
    }

    calculateSIP(monthlyInvestment, annualReturnRate, months) {
        const monthlyRate = annualReturnRate / 12 / 100;
        let maturityAmount;

        if (monthlyRate === 0) {
            maturityAmount = monthlyInvestment * months;
        } else {
            maturityAmount = monthlyInvestment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
        }

        const totalInvestment = monthlyInvestment * months;
        const expectedReturns = maturityAmount - totalInvestment;

        return {
            totalInvestment: Math.round(totalInvestment),
            expectedReturns: Math.round(expectedReturns),
            maturityAmount: Math.round(maturityAmount)
        };
    }

    displayResults(result, monthlyInvestment, returnRate, months) {
        document.getElementById('totalInvestment').textContent = this.formatCurrency(result.totalInvestment);
        document.getElementById('expectedReturns').textContent = this.formatCurrency(result.expectedReturns);
        document.getElementById('maturityAmount').textContent = this.formatCurrency(result.maturityAmount);
        document.getElementById('breakdownMonthly').textContent = this.formatCurrency(monthlyInvestment);
        document.getElementById('breakdownMonths').textContent = months;
        document.getElementById('breakdownRate').textContent = returnRate + '%';

        this.updateChart(result, months, monthlyInvestment, returnRate);
    }

    updateChart(result, months, monthlyInvestment, returnRate) {
        const ctx = document.getElementById('resultChart').getContext('2d');
        const labels = [];
        const investmentData = [];
        const returnsData = [];
        const step = Math.max(1, Math.floor(months / 12));

        for (let i = 0; i <= months; i += step) {
            const calc = this.calculateSIP(monthlyInvestment, returnRate, i);
            const percentage = months > 0 ? Math.round((i / months) * 100) : 0;
            labels.push(percentage + '%');
            investmentData.push(calc.totalInvestment);
            returnsData.push(calc.expectedReturns);
        }

        labels[labels.length - 1] = months + 'M';

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Total Investment', data: investmentData, backgroundColor: '#667eea', borderRadius: 6 },
                    { label: 'Expected Returns', data: returnsData, backgroundColor: '#10b981', borderRadius: 6 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: (context) => context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN')
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                if (value >= 1000000) return '₹' + (value / 1000000).toFixed(1) + 'M';
                                if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'K';
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    formatCurrency(value) {
        return '₹' + Math.round(value).toLocaleString('en-IN');
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.classList.remove('hidden');
    }

    clearError() {
        this.errorDiv.classList.add('hidden');
    }
}

// Chit Calculator
class ChitCalculator {
    constructor() {
        this.form = document.getElementById('chitForm');
        this.totalMonthsInput = document.getElementById('totalMonths');
        this.bidMonthInput = document.getElementById('bidMonth');
        this.monthlyTableContainer = document.getElementById('monthlyTableContainer');
        this.monthlyTableBody = document.getElementById('monthlyTableBody');
        this.ratesGroupContainer = document.getElementById('ratesGroupContainer');
        this.lumpSumRateContainer = document.getElementById('lumpSumRateContainer');
        this.interestRateContainer = document.getElementById('interestRateContainer');
        this.chitCalculateBtn = document.getElementById('chitCalculateBtn');
        this.resultsDiv = document.getElementById('chitResults');
        this.errorDiv = document.getElementById('chitError');
        this.monthlyData = {};

        this.totalMonthsInput.addEventListener('change', () => this.generateMonthlyTable());
        this.bidMonthInput.addEventListener('change', () => this.validateBidMonth());
        this.form.addEventListener('submit', (e) => this.handleCalculate(e));
    }

    generateMonthlyTable() {
        this.clearError();
        const totalMonths = parseInt(this.totalMonthsInput.value);

        if (!totalMonths || totalMonths < 1) {
            this.showError('Please enter a valid number of months');
            return;
        }

        this.monthlyTableBody.innerHTML = '';
        this.monthlyData = {};
        this.bidMonthInput.value = '';
        this.bidMonthInput.max = totalMonths;
        this.lumpSumRateContainer.classList.add('hidden');
        this.interestRateContainer.classList.add('hidden');
        this.chitCalculateBtn.classList.add('hidden');

        for (let month = 1; month <= totalMonths; month++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${month}</td>
                <td><input type="number" class="monthly-premium" data-month="${month}" placeholder="8000" min="0" step="100" value="8000"></td>
                <td><input type="number" class="bid-amount" data-month="${month}" placeholder="180000" min="0" step="1000" value="0"></td>
            `;
            this.monthlyTableBody.appendChild(row);
        }

        this.monthlyTableContainer.classList.remove('hidden');

        document.querySelectorAll('.monthly-premium, .bid-amount').forEach(input => {
            input.addEventListener('change', () => this.storeMonthlyData());
        });

        this.storeMonthlyData();
    }

    storeMonthlyData() {
        this.monthlyData = {};
        document.querySelectorAll('.monthly-premium').forEach(input => {
            const month = parseInt(input.dataset.month);
            const premium = parseFloat(input.value) || 0;
            const bidAmount = parseFloat(document.querySelector(`.bid-amount[data-month="${month}"]`).value) || 0;
            this.monthlyData[month] = { premium, bidAmount };
        });
    }

    validateBidMonth() {
        this.clearError();
        const bidMonth = parseInt(this.bidMonthInput.value);
        const totalMonths = parseInt(this.totalMonthsInput.value);

        if (!bidMonth) {
            this.lumpSumRateContainer.classList.add('hidden');
            this.interestRateContainer.classList.add('hidden');
            this.chitCalculateBtn.classList.add('hidden');
            return;
        }

        if (bidMonth < 1 || bidMonth > totalMonths) {
            this.showError(`Bid month must be between 1 and ${totalMonths}`);
            this.bidMonthInput.value = '';
            this.lumpSumRateContainer.classList.add('hidden');
            this.interestRateContainer.classList.add('hidden');
            this.chitCalculateBtn.classList.add('hidden');
            return;
        }

        const bidAmount = this.monthlyData[bidMonth]?.bidAmount;
        if (!bidAmount || bidAmount === 0) {
            this.showError(`Please enter a bid amount for month ${bidMonth}`);
            this.lumpSumRateContainer.classList.add('hidden');
            this.interestRateContainer.classList.add('hidden');
            this.chitCalculateBtn.classList.add('hidden');
            return;
        }

        this.lumpSumRateContainer.classList.remove('hidden');
        this.interestRateContainer.classList.remove('hidden');
        this.chitCalculateBtn.classList.remove('hidden');
    }

    handleCalculate(e) {
        e.preventDefault();
        this.clearError();

        try {
            const bidMonth = parseInt(this.bidMonthInput.value);
            const rdReturnRate = parseFloat(document.getElementById('rdReturnRate').value);
            const lumpSumRate = parseFloat(document.getElementById('lumpSumRate').value);
            const totalMonths = parseInt(this.totalMonthsInput.value);

            if (!bidMonth) {
                this.showError('Please select a bid month');
                return;
            }

            if (!rdReturnRate || rdReturnRate < 0 || rdReturnRate > 100) {
                this.showError('RD/SIP return rate must be between 0% and 100%');
                return;
            }

            if (!lumpSumRate || lumpSumRate < 0 || lumpSumRate > 100) {
                this.showError('Lumpsum rate must be between 0% and 100%');
                return;
            }

            const bidAmount = this.monthlyData[bidMonth].bidAmount;
            if (!bidAmount) {
                this.showError(`Please enter bid amount for month ${bidMonth}`);
                return;
            }

            this.displayResults(bidMonth, rdReturnRate, lumpSumRate, totalMonths, bidAmount);
        } catch (error) {
            this.showError('An error occurred. Please check your inputs.');
        }
    }

    displayResults(bidMonth, rdReturnRate, lumpSumRate, totalMonths, bidAmount) {
        document.getElementById('summaryBidMonth').textContent = `Month ${bidMonth}`;
        document.getElementById('summaryBidAmount').textContent = this.formatCurrency(bidAmount);

        let totalPayments = 0;
        for (let month = 1; month <= totalMonths; month++) {
            totalPayments += this.monthlyData[month].premium;
        }
        document.getElementById('summaryTotalPayments').textContent = this.formatCurrency(totalPayments);

        this.generateComparisonTable(bidMonth, rdReturnRate, lumpSumRate, totalMonths, bidAmount);
        document.getElementById('tableRateText').textContent = lumpSumRate + '%';
        document.getElementById('tableSipRateText').textContent = rdReturnRate + '%';

        this.resultsDiv.classList.remove('hidden');
    }

    generateComparisonTable(bidMonth, rdReturnRate, lumpSumRate, totalMonths, bidAmount) {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        const monthlyRdRate = rdReturnRate / 12 / 100;
        const monthlyLsRate = lumpSumRate / 12 / 100;

        for (let month = bidMonth + 1; month <= totalMonths; month++) {
            const monthsPassed = month - bidMonth;
            const monthlyPremium = this.monthlyData[month].premium;

            const lumpSumValue = bidAmount * Math.pow(1 + monthlyLsRate, monthsPassed);

            let sipAccumulated = 0;
            for (let m = bidMonth + 1; m <= month; m++) {
                const premiumToAdd = this.monthlyData[m].premium;
                const monthsToGrow = month - m;
                sipAccumulated += premiumToAdd * Math.pow(1 + monthlyRdRate, monthsToGrow);
            }

            const netGainLoss = lumpSumValue - sipAccumulated;
            const gainLossClass = netGainLoss >= 0 ? 'positive' : 'negative';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Month ${month}</td>
                <td>${this.formatCurrency(monthlyPremium)}</td>
                <td>${this.formatCurrency(Math.round(lumpSumValue))}</td>
                <td>${this.formatCurrency(Math.round(sipAccumulated))}</td>
                <td class="${gainLossClass}">${this.formatCurrency(Math.round(netGainLoss))}</td>
            `;
            tableBody.appendChild(row);
        }
    }

    formatCurrency(value) {
        return '₹' + Math.round(value).toLocaleString('en-IN');
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.classList.remove('hidden');
    }

    clearError() {
        this.errorDiv.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TabManager();
    new SIPCalculator();
    new ChitCalculator();
});
