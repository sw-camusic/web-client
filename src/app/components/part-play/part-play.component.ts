import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-part-play",
  styleUrls: ["./part-play.component.css"],
  templateUrl: "./part-play.component.html",
})
export class PartPlayComponent implements AfterViewInit, OnInit {

  public debugFpsActual: number;
  public debugLog: string;
  public debugMode: boolean;

  public fps: number;

  public width: number;
  public height: number;

  public isLoading: boolean;

  private isCalledNgAfterViewInit: boolean;
  private isCalledNgOnInit: boolean;
  private isCalledOnLoadedMetaData: boolean;

  private openCv: any;
  private openCvCap: any;
  private openCvDst: any;
  private openCvHigh: any;
  private openCvLow: any;
  private openCvSrc: any;

  @ViewChild("video") private video: ElementRef;

  public constructor() {
  }

  public ngAfterViewInit(): void {
    this.isCalledNgAfterViewInit = true;
  }

  public ngOnInit(): void {
    this.debugFpsActual = 0;
    this.debugLog = "";
    this.debugMode = !environment.production;

    this.isLoading = true;

    this.isCalledNgAfterViewInit = false;
    this.isCalledNgOnInit = false;
    this.isCalledOnLoadedMetaData = false;

    this.init();

    this.isCalledNgOnInit = true;
  }

  public onLoadedMetaData(): void {
    this.isCalledOnLoadedMetaData = true;
  }

  public openCvInit(): void {
    this.openCvCap = new this.openCv.VideoCapture(this.video.nativeElement);
    this.openCvDst = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);
    this.openCvSrc = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);

    this.openCvLow = new this.openCv.Mat(this.openCvSrc.rows, this.openCvSrc.cols, this.openCvSrc.type(), [0, 0, 0, 0]);
    this.openCvHigh = new this.openCv.Mat(this.openCvSrc.rows, this.openCvSrc.cols, this.openCvSrc.type(), [48, 48, 48, 255]);
  }

  public openCvLoop(): void {
    this.openCvCap.read(this.openCvSrc);
    this.openCv.inRange(this.openCvSrc, this.openCvLow, this.openCvHigh, this.openCvDst);
    this.openCv.imshow("canvas", this.openCvDst);

    // this.openCvCap.read(this.openCvSrc);
    //
    // this.openCv.cvtColor(this.openCvSrc, this.openCvDst, this.openCv.COLOR_RGBA2GRAY, 0);
    // this.openCv.threshold(this.openCvDst, this.openCvDst, 120, 200, this.openCv.THRESH_BINARY);
    //
    // const contours: any = new this.openCv.MatVector();
    // const hierarchy: any = new this.openCv.Mat();
    //
    // this.openCv.findContours(this.openCvDst, contours, hierarchy, this.openCv.RETR_CCOMP, this.openCv.CHAIN_APPROX_SIMPLE);
    //
    // this.dLog("openCvLoop", "" + contours.size());
    //
    // for (let i: number = 0; i < contours.size(); i++) {
    //   const color: any = new this.openCv.Scalar(255, 0, 0);
    //   this.openCv.drawContours(this.openCvDst, contours, i, color, 1, this.openCv.LINE_8, hierarchy, 100);
    // }
    //
    // this.openCv.imshow("canvas", this.openCvDst);
    // contours.delete();
    // hierarchy.delete();
  }

  private dLog(label: string, msg: string): void {
    this.debugLog = new Date().toISOString()
      + " ["
      + (label + "                ").substring(0, 16)
      + "]: "
      + msg
      + "<br>"
      + this.debugLog;
  }

  private init(): void {
    this.dLog("init", "initializing...");

    Promise.all([
      this.initUserMedia(),
      this.initVariable(),
      this.loadOpenCv(),
    ]).then(() => {
      this.dLog("init", "openCvInit: initializing...");

      this.openCv = window["cv"];

      try {
        this.openCvInit();
      } catch (e) {
        this.dLog("init", "openCvInit: " + e);
        throw e;
      }

      this.dLog("init", "openCvInit: done.");
    }).then(() => {
      this.dLog("init", "openCvLoop: initializing...");

      this.isLoading = false;

      let last: number = Date.now();
      const loop: () => void = () => {
        const begin: number = Date.now();

        try {
          this.openCvLoop();
        } catch (e) {
          this.dLog("openCvLoop", e);
          throw e;
        }

        this.debugFpsActual = Math.round(1000 / (begin - last));
        last = begin;

        setTimeout(loop, 1000 / this.fps - (Date.now() - begin));
      };

      setTimeout(loop, 0);
      this.dLog("init", "openCvLoop: done.");
    }).then(() => {
      this.dLog("init", "initialized.");
    }).catch(() => {
      this.dLog("init", "failed.");
    });
  }

  private initUserMedia(): Promise<any> {
    return this.wait(() => {
      return !this.isCalledNgOnInit;
    }).then(() => {
      this.dLog("initUserMedia", "initializing...");
      this.dLog("initUserMedia", "getUserMedia...");

      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "environment",
          height: 320,
          width: 240,
        },
      });
    }).then((value: MediaStream) => {
      this.dLog("initUserMedia", "getUserMedia... succeed.");

      this.video.nativeElement.srcObject = value;
      this.video.nativeElement.play();
    }).then(() => {
      return this.wait(() => {
        return !this.isCalledOnLoadedMetaData;
      });
    }).then(() => {
      this.width = this.video.nativeElement.videoWidth;
      this.height = this.video.nativeElement.videoHeight;

      this.dLog("initUserMedia", "width = " + this.width);
      this.dLog("initUserMedia", "height = " + this.height);

      this.dLog("initUserMedia", "done.");
    }).catch(() => {
      this.dLog("initUserMedia", "failed.");
    });
  }

  private initVariable(): Promise<any> {
    return this.wait(() => {
      return !this.isCalledNgOnInit;
    }).then(() => {
      this.dLog("initVariable", "initializing...");

      this.fps = 30;
      this.dLog("initVariable", "fps = " + this.fps);

      this.dLog("initVariable", "done.");
    });
  }

  private loadOpenCv(): Promise<any> {
    return this.wait(() => {
      return !this.isCalledNgAfterViewInit;
    }).then(() => {
      this.dLog("loadOpenCv", "loading...");

      const script: HTMLElement = document.createElement("script");
      script.setAttribute("async", "");
      script.setAttribute("src", "/assets/opencv.js");
      this.video.nativeElement.parentElement.appendChild(script);
    }).then(() => {
      return this.wait(() => {
        return window["cv"] === undefined || window["cv"].Mat === undefined;
      });
    }).then(() => {
      this.dLog("loadOpenCv", "done.");
    });
  }

  private wait(until: () => boolean): Promise<any> {
    return new Promise((resolve: () => void) => {
      const loop: () => void = () => {
        if (until()) {
          setTimeout(loop, 1000);
        } else {
          resolve();
        }
      };

      loop();
    });
  }

}
