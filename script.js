// SIP Calculator Logic
class SIPCalculator {
    constructor() {
        this.form = document.getElementById('sipForm');
        this.resultsDiv = document.getElementById('results');
        this.errorDiv = document.getElementById('error');
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

            // Convert to months
            const months = timeUnit === 'years' ? timePeriod * 12 : timePeriod;

            // Calculate SIP
            const result = this.calculateSIP(monthlyInvestment, returnRate, months);

            // Display results
            this.displayResults(result, monthlyInvestment, returnRate, months);
            this.resultsDiv.classList.remove('hidden');
        } catch (error) {
            this.showError('An error occurred. Please check your inputs.');
            console.error(error);
        }
    }

    calculateSIP(monthlyInvestment, annualReturnRate, months) {
        // Convert annual rate to monthly rate
        const monthlyRate = annualReturnRate / 12 / 100;

        // SIP Formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
        // Where:
        // P = monthly investment
        // r = monthly interest rate
        // n = number of months

        let maturityAmount;

        if (monthlyRate === 0) {
            // If rate is 0, just sum up all investments
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
        // Update result cards
        document.getElementById('totalInvestment').textContent = 
            this.formatCurrency(result.totalInvestment);
        document.getElementById('expectedReturns').textContent = 
            this.formatCurrency(result.expectedReturns);
        document.getElementById('maturityAmount').textContent = 
            this.formatCurrency(result.maturityAmount);

        // Update breakdown
        document.getElementById('breakdownMonthly').textContent = 
            this.formatCurrency(monthlyInvestment);
        document.getElementById('breakdownMonths').textContent = months;
        document.getElementById('breakdownRate').textContent = returnRate + '%';

        // Update chart
        this.updateChart(result, months);
    }

    updateChart(result, months) {
        const ctx = document.getElementById('resultChart').getContext('2d');

        // Prepare chart data
        const labels = [];
        const investmentData = [];
        const returnsData = [];

        for (let i = 0; i <= months; i += Math.max(1, Math.floor(months / 12))) {
            const calculationResult = this.calculateSIP(
                result.monthlyInvestment,
                result.annualReturnRate,
                i
            );
            labels.push(i === 0 ? '0' : `${Math.round((i / months) * 100)}%`);
            investmentData.push(calculationResult.totalInvestment);
            returnsData.push(calculationResult.expectedReturns);
        }

        // Add the final month
        labels[labels.length - 1] = `${months}M`;

        // Destroy previous chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Create new chart
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
                                    return '₹' + (value / 1000000).toFixed(0) + 'M';
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

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SIPCalculator();
});
