import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyFabButtonComponent } from './my-fab-button.component';

describe('MyFabButtonComponent', () => {
  let component: MyFabButtonComponent;
  let fixture: ComponentFixture<MyFabButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyFabButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyFabButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
