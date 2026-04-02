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
  currencies: string[] = [];

  from = 'USD';
  to = 'PKR';
  amount = 1;
  result = 0;
  date: string | null = null;

  loading = false;

  history: HistoryRecord[] = [];

  constructor(private readonly currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.loadCurrencies();
    this.loadHistory();
  }

  loadCurrencies(): void {
    this.currencyService.getCurrencies().subscribe((res) => {
      this.currencies = Object.keys(res.data);
    });
  }

  convert(): void {
    this.loading = true;

    const request = this.date
      ? this.currencyService.getHistorical(this.from, this.date)
      : this.currencyService.getLatest(this.from);

    request.subscribe((res) => {
      const rate = res.data[this.to];
      this.result = this.amount * rate;

      this.saveHistory(rate);
      this.loading = false;
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
    localStorage.setItem('conversion_history', JSON.stringify(this.history));
  }

  loadHistory(): void {
    const data = localStorage.getItem('conversion_history');
    if (data) {
      this.history = JSON.parse(data);
    }
  }
}