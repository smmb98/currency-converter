import { Component, OnInit } from '@angular/core';
import { CurrencyService } from '../../core/currency.service';

interface HistoryRecord {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  date: string;
  timestamp: string;
}

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss'],
})
export class ConverterComponent implements OnInit {
  currencies: string[] = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'PKR', 'BRL', 'MXN', 'SGD', 'HKD', 'KRW', 'SEK', 'NOK', 'DKK', 'NZD', 'ZAR', 'RUB', 'TRY', 'PLN', 'THB', 'IDR', 'MYR', 'PHP', 'VND', 'EGP', 'AED', 'SAR', 'KRW'];

  from = 'USD';
  to = 'PKR';
  amount = 1;
  result = 0;
  date: string | null = null;

  loading = false;
  currenciesLoaded = false;

  history: HistoryRecord[] = [];

  constructor(private readonly currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.currencyService.getCurrencies().subscribe({
      next: (res) => {
        if (res && res.data) {
          const keys = Object.keys(res.data);
          if (keys.length > 0) {
            this.currencies = keys.sort();
            this.currenciesLoaded = true;
          }
        }
      },
      error: (err) => {
        console.error('Failed to load currencies:', err);
      }
    });
  }

  convert(): void {
    if (!this.amount || !this.from || !this.to) {
      return;
    }

    this.loading = true;

    const request = this.date
      ? this.currencyService.getHistorical(this.from, this.date)
      : this.currencyService.getLatest(this.from);

    request.subscribe({
      next: (res) => {
        if (res && res.data && res.data[this.to]) {
          const rate = res.data[this.to];
          this.result = this.amount * rate;
          this.saveHistory(rate);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Conversion failed:', err);
        this.loading = false;
      }
    });
  }

  saveHistory(rate: number): void {
    const record: HistoryRecord = {
      from: this.from,
      to: this.to,
      amount: this.amount,
      result: this.result,
      rate,
      date: this.date || 'latest',
      timestamp: new Date().toISOString(),
    };

    this.history.unshift(record);
    if (this.history.length > 10) {
      this.history = this.history.slice(0, 10);
    }
    localStorage.setItem('conversion_history', JSON.stringify(this.history));
  }

  loadHistory(): void {
    const data = localStorage.getItem('conversion_history');
    if (data) {
      try {
        this.history = JSON.parse(data);
      } catch (e) {
        this.history = [];
      }
    }
  }

  onDateChange(event: any): void {
    const d = event.value;
    if (d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      this.date = `${year}-${month}-${day}`;
    } else {
      this.date = null;
    }
  }

  swapCurrencies(): void {
    const temp = this.from;
    this.from = this.to;
    this.to = temp;
  }

  clearHistory(): void {
    this.history = [];
    localStorage.removeItem('conversion_history');
  }
}