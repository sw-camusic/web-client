import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-part-play",
  styleUrls: ["./part-play.component.css"],
  templateUrl: "./part-play.component.html",
})
export class PartPlayComponent implements AfterViewInit, OnDestroy, OnInit {

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

  private openCvAnchor: any;
  private openCvHigh: any;
  private openCvLow: any;
  private openCvM: any;
  private openCvMorphologyDefaultBorderValue: any;

  @ViewChild("video") private video: ElementRef;

  public constructor() {
  }

  public ngAfterViewInit(): void {
    this.isCalledNgAfterViewInit = true;
  }

  public ngOnDestroy(): void {
    this.openCvLow.delete();
    this.openCvHigh.delete();
    this.openCvM.delete();
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

    this.openCvAnchor = new this.openCv.Point(-1, -1);
    this.openCvLow = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4, [0, 0, 0, 0]);
    this.openCvHigh = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4, [24, 24, 24, 255]);
    this.openCvM = this.openCv.Mat.ones(5, 5, this.openCv.CV_8U);
    this.openCvMorphologyDefaultBorderValue = this.openCv.morphologyDefaultBorderValue();
  }

  public openCvLoop(): void {
    const contours: any = new this.openCv.MatVector();
    const hierarchy: any = new this.openCv.Mat();
    const src: any = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);

    this.openCvCap.read(src);

    this.openCv.inRange(src, this.openCvLow, this.openCvHigh, src);
    this.openCv.erode(src, src,
      this.openCvM, this.openCvAnchor, 1, this.openCv.BORDER_CONSTANT, this.openCvMorphologyDefaultBorderValue);
    this.openCv.dilate(src, src,
      this.openCvM, this.openCvAnchor, 1, this.openCv.BORDER_CONSTANT, this.openCvMorphologyDefaultBorderValue);
    this.openCv.findContours(src, contours, hierarchy, this.openCv.RETR_LIST, this.openCv.CHAIN_APPROX_SIMPLE);

    const dst: any = new this.openCv.Mat.zeros(this.height, this.width, this.openCv.CV_8UC4);
    const color: any = new this.openCv.Scalar(255, 255, 255, 255);
    for (let i: number = 0; i < contours.size(); i++) {
      const circle: any = this.openCv.minEnclosingCircle(contours.get(i));

      if (circle.radius > 10) {
        this.openCv.circle(dst, circle.center, circle.radius, color);
      }
    }
    this.openCv.imshow("canvas", dst);
    dst.delete();

    contours.delete();
    hierarchy.delete();
    src.delete();
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

    const initPromiseList: Promise<any>[] = [
      this.initUserMedia(),
      this.initVariable(),
      this.loadOpenCv(),
    ];

    Promise.all(initPromiseList).then(() => {
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
      this.dLog("init", "done.");
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
