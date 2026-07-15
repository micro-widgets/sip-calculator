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
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }
}

// SIP Calculator Class
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

            // Validation
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
            console.error(error);
        }
    }

    calculateSIP(monthlyInvestment, annualReturnRate, months) {
        const monthlyRate = annualReturnRate / 12 / 100;
        let maturityAmount;

        if (monthlyRate === 0) {
            maturityAmount = monthlyInvestment * months;
        } else {
            maturityAmount = monthlyInvestment * 
                (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
        }

        const totalInvestment = monthlyInvestment * months;
        const expectedReturns = maturityAmount - totalInvestment;

        return {
            totalInvestment: Math.round(totalInvestment),
            expectedReturns: Math.round(expectedReturns),
            maturityAmount: Math.round(maturityAmount),
            monthlyInvestment: monthlyInvestment,
            months: months,
            annualReturnRate: annualReturnRate
        };
    }

    displayResults(result, monthlyInvestment, returnRate, months) {
        document.getElementById('totalInvestment').textContent = 
            this.formatCurrency(result.totalInvestment);
        document.getElementById('expectedReturns').textContent = 
            this.formatCurrency(result.expectedReturns);
        document.getElementById('maturityAmount').textContent = 
            this.formatCurrency(result.maturityAmount);

        document.getElementById('breakdownMonthly').textContent = 
            this.formatCurrency(monthlyInvestment);
        document.getElementById('breakdownMonths').textContent = months;
        document.getElementById('breakdownRate').textContent = returnRate + '%';

        this.updateChart(result, months);
    }

    updateChart(result, months) {
        const ctx = document.getElementById('resultChart').getContext('2d');

        const labels = [];
        const investmentData = [];
        const returnsData = [];
        const step = Math.max(1, Math.floor(months / 12));

        for (let i = 0; i <= months; i += step) {
            const calculationResult = this.calculateSIP(
                result.monthlyInvestment,
                result.annualReturnRate,
                i
            );
            
            const percentage = months > 0 ? Math.round((i / months) * 100) : 0;
            labels.push(percentage + '%');
            investmentData.push(calculationResult.totalInvestment);
            returnsData.push(calculationResult.expectedReturns);
        }

        const finalResult = this.calculateSIP(
            result.monthlyInvestment,
            result.annualReturnRate,
            months
        );
        
        labels[labels.length - 1] = months + 'M';
        investmentData[investmentData.length - 1] = finalResult.totalInvestment;
        returnsData[returnsData.length - 1] = finalResult.expectedReturns;

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Investment',
                        data: investmentData,
                        backgroundColor: '#667eea',
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: 'Expected Returns',
                        data: returnsData,
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            color: '#6b7280'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 13,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 12
                        },
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ₹' + 
                                    context.parsed.y.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#9ca3af'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        stacked: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#9ca3af',
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return '₹' + (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return '₹' + (value / 1000).toFixed(0) + 'K';
                                }
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
        this.errorDiv.textContent = '';
    }
}

// Chit Scheme Calculator Class
class ChitCalculator {
    constructor() {
        this.form = document.getElementById('chitForm');
        this.totalMonthsInput = document.getElementById('totalMonths');
        this.bidMonthSelect = document.getElementById('bidMonth');
        this.resultsDiv = document.getElementById('chitResults');
        this.errorDiv = document.getElementById('chitError');
        this.monthlyDetailsContainer = document.getElementById('monthlyDetailsContainer');
        this.monthlyDetailsGrid = document.getElementById('monthlyDetailsGrid');
        this.monthlyData = {};

        this.totalMonthsInput.addEventListener('change', () => this.generateMonthlyInputs());
        this.form.addEventListener('submit', (e) => this.handleCalculate(e));
    }

    generateMonthlyInputs() {
        this.clearError();
        const totalMonths = parseInt(this.totalMonthsInput.value);

        if (!totalMonths || totalMonths < 1) {
            this.showError('Please enter a valid number of months');
            return;
        }

        this.monthlyDetailsGrid.innerHTML = '';
        this.monthlyData = {};
        this.bidMonthSelect.innerHTML = '<option value="">-- Select month --</option>';

        for (let month = 1; month <= totalMonths; month++) {
            // Create card for each month
            const card = document.createElement('div');
            card.className = 'month-detail-card';
            card.innerHTML = `
                <h4>Month ${month}</h4>
                <div>
                    <label class="month-detail-label">Monthly Premium (₹)</label>
                    <input type="number" class="monthly-premium" data-month="${month}" 
                           placeholder="8000" min="0" step="100" value="8000">
                </div>
                <div>
                    <label class="month-detail-label">Bid Amount (₹)</label>
                    <input type="number" class="bid-amount" data-month="${month}" 
                           placeholder="180000" min="0" step="1000" value="${month === 10 ? '180000' : '0'}">
                </div>
            `;
            this.monthlyDetailsGrid.appendChild(card);

            // Add to bid month dropdown
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `Month ${month}`;
            this.bidMonthSelect.appendChild(option);
        }

        this.monthlyDetailsContainer.classList.remove('hidden');

        // Attach listeners to inputs
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

    handleCalculate(e) {
        e.preventDefault();
        this.clearError();

        try {
            const bidMonth = parseInt(this.bidMonthSelect.value);
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
            console.error(error);
        }
    }

    displayResults(bidMonth, rdReturnRate, lumpSumRate, totalMonths, bidAmount) {
        // Update summary
        document.getElementById('summaryBidMonth').textContent = `Month ${bidMonth}`;
        document.getElementById('summaryBidAmount').textContent = this.formatCurrency(bidAmount);

        let totalPayments = 0;
        for (let month = 1; month <= totalMonths; month++) {
            totalPayments += this.monthlyData[month].premium;
        }
        document.getElementById('summaryTotalPayments').textContent = this.formatCurrency(totalPayments);

        // Generate table
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

        let lumpSumValue = bidAmount;
        let sipAccumulated = 0;

        // Show rows for months after bid
        for (let month = bidMonth + 1; month <= totalMonths; month++) {
            const monthsPassed = month - bidMonth;
            const monthlyPremium = this.monthlyData[month].premium;

            // Calculate lumpsum value
            lumpSumValue = bidAmount * Math.pow(1 + monthlyLsRate, monthsPassed);

            // Calculate accumulated SIP
            sipAccumulated = 0;
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
        this.errorDiv.textContent = '';
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TabManager();
    new SIPCalculator();
    new ChitCalculator();
});
