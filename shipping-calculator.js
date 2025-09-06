class ShippingCalculator {
    constructor() {
        this.form = document.getElementById('shippingForm');
        this.resultsContainer = document.getElementById('results');
        this.newQuoteBtn = document.getElementById('newQuote');
        
        this.rates = {
            standard: { base: 5.99, perKg: 2.50, multiplier: 1.0 },
            express: { base: 12.99, perKg: 4.00, multiplier: 1.5 },
            overnight: { base: 25.99, perKg: 6.50, multiplier: 2.0 }
        };
        
        this.packageTypes = {
            document: { fee: 0, multiplier: 1.0 },
            package: { fee: 2.50, multiplier: 1.0 },
            fragile: { fee: 8.00, multiplier: 1.3 },
            hazardous: { fee: 15.00, multiplier: 1.8 }
        };
        
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.newQuoteBtn.addEventListener('click', () => this.resetForm());
        
        // Add real-time validation
        this.addValidation();
    }
    
    addValidation() {
        const weightInput = document.getElementById('weight');
        const dimensionsInput = document.getElementById('dimensions');
        
        weightInput.addEventListener('input', (e) => {
            if (e.target.value < 0) e.target.value = 0;
            if (e.target.value > 1000) {
                alert('Maximum weight is 1000kg. Please contact us for heavier shipments.');
                e.target.value = 1000;
            }
        });
        
        dimensionsInput.addEventListener('input', (e) => {
            const pattern = /^\d+x\d+x\d+$/;
            if (e.target.value && !pattern.test(e.target.value)) {
                e.target.setCustomValidity('Please enter dimensions in format: LxWxH (e.g., 30x20x15)');
            } else {
                e.target.setCustomValidity('');
            }
        });
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        this.showLoading();
        
        // Simulate API call delay
        setTimeout(() => {
            const quote = this.calculateShipping(data);
            this.displayResults(quote);
        }, 1500);
    }
    
    calculateShipping(data) {
        const weight = parseFloat(data.weight);
        const shippingType = data.shippingType;
        const packageType = data.packageType;
        const hasInsurance = data.insurance === 'on';
        
        // Get base rates
        const rate = this.rates[shippingType];
        const packageInfo = this.packageTypes[packageType];
        
        // Calculate costs
        const baseCost = rate.base;
        const weightCost = weight * rate.perKg;
        const serviceFee = packageInfo.fee;
        
        // Calculate subtotal
        let subtotal = (baseCost + weightCost + serviceFee) * packageInfo.multiplier;
        
        // Add insurance (3% of subtotal, minimum $5)
        const insuranceCost = hasInsurance ? Math.max(subtotal * 0.03, 5) : 0;
        
        // Calculate total
        const totalCost = subtotal + insuranceCost;
        
        // Calculate delivery date
        const deliveryDate = this.calculateDeliveryDate(shippingType);
        
        // Generate tracking number
        const trackingNumber = this.generateTrackingNumber();
        
        return {
            baseCost: baseCost.toFixed(2),
            weightCost: weightCost.toFixed(2),
            serviceFee: serviceFee.toFixed(2),
            insuranceCost: insuranceCost.toFixed(2),
            totalCost: totalCost.toFixed(2),
            deliveryDate,
            trackingNumber,
            shippingType,
            weight
        };
    }
    
    calculateDeliveryDate(shippingType) {
        const today = new Date();
        let daysToAdd;
        
        switch (shippingType) {
            case 'standard':
                daysToAdd = 6; // 5-7 days, using 6 as average
                break;
            case 'express':
                daysToAdd = 3; // 2-3 days, using 3 as average
                break;
            case 'overnight':
                daysToAdd = 1;
                break;
            default:
                daysToAdd = 6;
        }
        
        const deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() + daysToAdd);
        
        return deliveryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    generateTrackingNumber() {
        const prefix = 'LC'; // Logistics Company
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }
    
    showLoading() {
        const button = document.querySelector('.calculate-btn');
        button.innerHTML = '<span class="loading"></span> Calculating...';
        button.disabled = true;
    }
    
    displayResults(quote) {
        // Update result values
        document.getElementById('baseCost').textContent = `$${quote.baseCost}`;
        document.getElementById('weightCost').textContent = `$${quote.weightCost}`;
        document.getElementById('serviceFee').textContent = `$${quote.serviceFee}`;
        document.getElementById('insuranceCost').textContent = `$${quote.insuranceCost}`;
        document.getElementById('totalCost').textContent = `$${quote.totalCost}`;
        document.getElementById('deliveryDate').textContent = quote.deliveryDate;
        document.getElementById('trackingNumber').textContent = quote.trackingNumber;
        
        // Hide form and show results
        this.form.style.display = 'none';
        this.resultsContainer.style.display = 'block';
        
        // Scroll to results
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Store quote data for potential future use
        this.lastQuote = quote;
    }
    
    resetForm() {
        // Reset form
        this.form.reset();
        
        // Reset button state
        const button = document.querySelector('.calculate-btn');
        button.innerHTML = 'Calculate Shipping Cost';
        button.disabled = false;
        
        // Show form and hide results
        this.form.style.display = 'flex';
        this.resultsContainer.style.display = 'none';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Method to export quote data (for future API integration)
    exportQuote() {
        if (this.lastQuote) {
            return {
                ...this.lastQuote,
                timestamp: new Date().toISOString(),
                currency: 'USD'
            };
        }
        return null;
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShippingCalculator();
});

// Additional utility functions for future enhancements
const ShippingUtils = {
    // Convert weight units
    convertWeight(weight, fromUnit, toUnit) {
        const conversions = {
            'kg': 1,
            'lb': 0.453592,
            'g': 0.001,
            'oz': 0.0283495
        };
        
        const weightInKg = weight * conversions[fromUnit];
        return weightInKg / conversions[toUnit];
    },
    
    // Calculate dimensional weight
    calculateDimensionalWeight(length, width, height, divisor = 5000) {
        return (length * width * height) / divisor;
    },
    
    // Validate postal codes (basic implementation)
    validatePostalCode(code, country = 'US') {
        const patterns = {
            'US': /^\d{5}(-\d{4})?$/,
            'CA': /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
            'UK': /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/
        };
        
        return patterns[country] ? patterns[country].test(code) : true;
    }
};