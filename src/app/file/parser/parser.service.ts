import {Injectable} from '@angular/core';
import {parseString, Parser, OptionsV2} from 'xml2js';
import {ReadFile} from '@rabo/file/file.model';
import {Observable, of} from 'rxjs';
import {MT940} from '@rabo/file/MT940.model';

@Injectable({
	providedIn: 'root'
})
export class ParserService {
	constructor() {}
	public parse(files: ReadFile[]): Observable<MT940[]> {
		const parsed: MT940[] = [];
		for (let i = 0; i < files.length; i++) {
			const {contents, type} = files[i];

			if (!type) {
				throw new Error('Cannot parse file without a type');
			}

			if (type.indexOf('csv') >= 0) {
				parsed.push(...this.csvJs(contents));
			}

			if (type.indexOf('xml') >= 0) {
				// it's recommended to create a parser per File
				const parser = new Parser({
					explicitArray: false
				});

				parser.parseString(contents, (err, result) => {
					if (err) {
						throw err;
					}
					const {record}: {record: any[]} = result.records;
					const arr: MT940[] = [];
					for (let j = 0; j < record.length; j++) {
						arr.push({
							reference: record[j].$.reference,
							accountNumber: record[j].accountNumber,
							description: record[j].description,
							startBalance: record[j].startBalance,
							endBalance: record[j].endBalance,
							mutation: record[j].mutation
						});
					}
					parsed.push(...arr);
				});
			}
		}
		return of(parsed);
	}

	private xmlJs() {}

	private csvJs(csvText: string) {
		const lines = csvText.split('\n');
		const result: MT940[] = [];
		const headers = lines[0].split(',');

		for (let i = 1; i < lines.length - 1; i++) {
			const obj = {} as MT940;
			const currentline = lines[i].split(',');

			for (let j = 0; j < headers.length; j++) {
				obj[headers[j]] = currentline[j];
			}
			result.push(obj);
		}

		return result;
	}
}