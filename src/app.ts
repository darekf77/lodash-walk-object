//#region @notForNpm
//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-lodash-walk-object',
  template: 'hello from lodash-walk-object',
})
export class LodashWalkObjectComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}

@NgModule({
  imports: [],
  exports: [LodashWalkObjectComponent],
  declarations: [LodashWalkObjectComponent],
  providers: [],
})
export class LodashWalkObjectModule {}
//#endregion

//#region @backend
async function start(port: number) {}

export default start;

//#endregion

//#endregion
