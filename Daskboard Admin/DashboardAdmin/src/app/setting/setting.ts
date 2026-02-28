import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [],
  templateUrl: './setting.html',
  styleUrls: ['./setting.css'],
})
export class Setting {
  isDark = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
    const storedTheme = localStorage.getItem('theme');
    this.isDark = storedTheme
      ? storedTheme === 'dark'
      : this.document.body.classList.contains('dark');
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    this.document.body.classList.toggle('dark', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

}
