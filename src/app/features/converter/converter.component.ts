import { Component, OnInit } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CurrencyService } from '../../core/currency.service';
import { CurrencyMeta, HistoryRecord } from '../../core/models/currency.models';

const HISTORY_KEY = 'conversion_history';
const MAX_HISTORY = 20;

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss'],
})
export class ConverterComponent implements OnInit {
  currencies: CurrencyMeta[] = [];
  currenciesLoading = false;
  currenciesError: string | null = null;

  from = '';
  to = '';
  amount: number | null = null;
  selectedDate: Date | null = null;
  formattedDate: string | null = null;

  converting = false;
  conversionError: string | null = null;
  amountError: string | null = null;

  result: number | null = null;
  resultRate: number | null = null;

  history: HistoryRecord[] = [];

  readonly maxDate: Date = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  })();

  constructor(private readonly currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.currenciesLoading = true;
    this.currenciesError = null;
    this.currencies = [];

    this.pipe$(this.currencyService.getCurrencies(), () => {
      this.currenciesLoading = false;
    }).subscribe({
      next: (res: any) => {
        this.currencies = Object.values(res.data).sort((a: any, b: any) =>
          a.code.localeCompare(b.code)
        ) as CurrencyMeta[];
        this.from = 'USD';
        this.to = 'EUR';
      },
      error: (err: Error) => {
        this.currenciesError = err.message;
      },
    });
  }

  onDateChange(event: any): void {
    const d: Date | null = event.value;
    if (d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      this.formattedDate = `${y}-${m}-${day}`;
      this.selectedDate = d;
    } else {
      this.formattedDate = null;
      this.selectedDate = null;
    }
    this.result = null;
    this.conversionError = null;
  }

  clearDate(): void {
    this.formattedDate = null;
    this.selectedDate = null;
    this.result = null;
    this.conversionError = null;
  }

  swapCurrencies(): void {
    const tmp = this.from;
    this.from = this.to;
    this.to = tmp;
    this.result = null;
    this.conversionError = null;
  }

  convert(): void {
    if (!this.validateForm()) return;

    this.converting = true;
    this.conversionError = null;
    this.result = null;

    const src$ = this.formattedDate
      ? this.currencyService.getHistorical(this.from, this.formattedDate)
      : this.currencyService.getLatest(this.from);

    this.pipe$(src$, () => {
      this.converting = false;
    }).subscribe({
      next: (res: any) => {
        const rates = this.formattedDate
          ? res.data[this.formattedDate]
          : res.data;

        if (!rates || rates[this.to] === undefined) {
          this.conversionError = `Exchange rate for ${this.to} is not available.`;
          return;
        }

        const rate: number = rates[this.to];
        this.result = this.amount! * rate;
        this.resultRate = rate;
        this.saveHistory(rate);
      },
      error: (err: Error) => {
        this.conversionError = err.message;
      },
    });
  }

  private pipe$(source$: Observable<any>, onFinalize: () => void): Observable<any> {
    return source$.pipe(
      catchError((err: Error) => { throw err; }),
      finalize(onFinalize)
    );
  }

  private validateForm(): boolean {
    this.amountError = null;
    this.conversionError = null;

    if (this.amount === null || this.amount === undefined || String(this.amount).trim() === '') {
      this.amountError = 'Please enter an amount.';
      return false;
    }
    if (isNaN(Number(this.amount)) || !isFinite(Number(this.amount))) {
      this.amountError = 'Amount must be a valid number.';
      return false;
    }
    if (this.amount <= 0) {
      this.amountError = 'Amount must be greater than zero.';
      return false;
    }
    if (this.amount > 1_000_000_000) {
      this.amountError = 'Amount is too large (max 1,000,000,000).';
      return false;
    }
    if (!this.from || !this.to) {
      this.conversionError = 'Please select both currencies.';
      return false;
    }
    if (this.from === this.to) {
      this.conversionError = 'From and To currencies must be different.';
      return false;
    }
    return true;
  }

  private saveHistory(rate: number): void {
    const record: HistoryRecord = {
      from: this.from,
      to: this.to,
      amount: this.amount!,
      result: this.result!,
      rate,
      date: this.formattedDate ?? 'latest',
      timestamp: new Date().toISOString(),
    };
    this.history.unshift(record);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }

  loadHistory(): void {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      this.history = raw ? JSON.parse(raw) : [];
    } catch {
      this.history = [];
    }
  }

  clearHistory(): void {
    this.history = [];
    localStorage.removeItem(HISTORY_KEY);
  }

  formatTimestamp(iso: string): string {
    const d = new Date(iso);
    return (
      d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' · ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    );
  }

  get dropdownsDisabled(): boolean {
    return this.currenciesLoading || !!this.currenciesError;
  }

  getCurrencyName(code: string): string {
    return this.currencies.find(c => c.code === code)?.name ?? '';
  }
}
