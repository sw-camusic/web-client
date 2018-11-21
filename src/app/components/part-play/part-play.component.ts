import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-part-play",
  styleUrls: ["./part-play.component.css"],
  templateUrl: "./part-play.component.html",
})
export class PartPlayComponent implements AfterViewInit, OnDestroy, OnInit {

  public iCvHigh: number[];
  public iCvLow: number[];
  public iCvRadiusMax: number;
  public iCvRadiusMin: number;
  public iCvSrc: string;

  public iDebugMode: boolean;

  public iSystemFps: number;

  public iUserMediaHeight: number;
  public iUserMediaWidth: number;

  public oCvIsReady: boolean;

  public oDebugLog: string;

  public oSystemFps: number;
  public oSystemIsReady: boolean;
  public oSystemLoopAt: number[];

  public oUserMediaHeight: number;
  public oUserMediaIsReady: boolean;
  public oUserMediaWidth: number;

  @ViewChild("video")
  private eVideo: ElementRef;

  private mCv: any;
  private mCvAnchor: any;
  private mCvCap: any;
  private mCvHigh: any;
  private mCvLow: any;
  private mCvM: any;
  private mCvMorphologyDefaultBorderValue: any;

  public constructor() {
    this.iCvHigh = [255, 100, 100, 255];
    this.iCvLow = [160, 4, 4, 0];
    this.iCvRadiusMax = 80;
    this.iCvRadiusMin = 8;
    this.iCvSrc = "/assets/opencv.js";

    this.iDebugMode = !environment.production;

    this.iSystemFps = 60;

    this.iUserMediaHeight = 360;
    this.iUserMediaWidth = 640;

    this.oCvIsReady = false;

    this.oDebugLog = "";

    this.oSystemFps = 0;
    this.oSystemIsReady = false;
    this.oSystemLoopAt = [0, 0, 0, 0, 0, 0, 0, 0];

    this.oUserMediaHeight = 0;
    this.oUserMediaIsReady = false;
    this.oUserMediaWidth = 0;
  }

  public ngAfterViewInit(): void {
    this.async(() => {
      this.systemInit();
    });
  }

  public ngOnDestroy(): void {
    this.async(() => {
      this.systemDestroy();
    });
  }

  public ngOnInit(): void {
  }

  private async(fn: () => void): Promise<any> {
    return this.wait(0).then(fn);
  }

  private cvDestroy(): Promise<any> {
    return Promise.resolve().then(() => {
      this.debugLog("cvDestroy", "# 1 / 1");

      this.mCvHigh.delete();
      this.mCvLow.delete();
      this.mCvM.delete();
    }).then(() => {
      this.debugLog("cvDestroy", "# done");
      this.oCvIsReady = false;
    });
  }

  private cvInit(): Promise<any> {
    return Promise.resolve().then(() => {
      this.debugLog("cvInit", "# 1 / 4");

      const script: HTMLElement = document.createElement("script");
      script.setAttribute("async", "");
      script.setAttribute("src", this.iCvSrc);
      this.eVideo.nativeElement.parentElement.appendChild(script);
    }).then(() => {
      this.debugLog("cvInit", "# 2 / 4");

      return this.waitUntil(() => {
        return window["cv"] === undefined || window["cv"].Mat === undefined;
      });
    }).then(() => {
      this.debugLog("cvInit", "# 3 / 4");

      return this.waitUntil(() => {
        return !this.oUserMediaIsReady;
      });
    }).then(() => {
      this.debugLog("cvInit", "# 4 / 4");

      this.mCv = window["cv"];
      this.mCvAnchor = new this.mCv.Point(-1, -1);
      this.mCvCap = new this.mCv.VideoCapture(this.eVideo.nativeElement);
      this.mCvHigh = new this.mCv.Mat(this.oUserMediaHeight, this.oUserMediaWidth, this.mCv.CV_8UC4, this.iCvHigh);
      this.mCvLow = new this.mCv.Mat(this.oUserMediaHeight, this.oUserMediaWidth, this.mCv.CV_8UC4, this.iCvLow);
      this.mCvM = this.mCv.Mat.ones(5, 5, this.mCv.CV_8U);
      this.mCvMorphologyDefaultBorderValue = this.mCv.morphologyDefaultBorderValue();
    }).then(() => {
      this.debugLog("cvInit", "# done");
      this.oCvIsReady = true;
    });
  }

  private cvUpdate(): void {
    const contours: any = new this.mCv.MatVector();
    const hierarchy: any = new this.mCv.Mat();
    const src: any = new this.mCv.Mat(this.oUserMediaHeight, this.oUserMediaWidth, this.mCv.CV_8UC4);

    this.mCvCap.read(src);

    this.mCv.flip(src, src, 1);
    this.mCv.inRange(src, this.mCvLow, this.mCvHigh, src);
    this.mCv.erode(src, src, this.mCvM, this.mCvAnchor, 1, this.mCv.BORDER_CONSTANT, this.mCvMorphologyDefaultBorderValue);
    this.mCv.dilate(src, src, this.mCvM, this.mCvAnchor, 1, this.mCv.BORDER_CONSTANT, this.mCvMorphologyDefaultBorderValue);
    this.mCv.findContours(src, contours, hierarchy, this.mCv.RETR_LIST, this.mCv.CHAIN_APPROX_SIMPLE);

    // for (let i: number = 0; i < contours.size(); i++) {
    //   const circle: any = this.mCv.minEnclosingCircle(contours.get(i));
    // }

    if (this.iDebugMode) {
      const dst: any = new this.mCv.Mat.zeros(this.oUserMediaHeight, this.oUserMediaWidth, this.mCv.CV_8UC4);
      const dstColor: any = new this.mCv.Scalar(255, 255, 255, 255);

      for (let i: number = 0; i < contours.size(); i++) {
        const circle: any = this.mCv.minEnclosingCircle(contours.get(i));

        if (circle.radius > 16) {
          this.mCv.circle(dst, circle.center, circle.radius, dstColor);
        }
      }

      this.mCv.imshow("canvas", dst);
      dst.delete();
    }

    contours.delete();
    hierarchy.delete();
    src.delete();
  }

  private debugLog(label: string, message: string): void {
    if (this.iDebugMode) {
      this.oDebugLog = new Date().toISOString()
        + " ["
        + (label + "                ").substring(0, 16)
        + "]: "
        + message
        + "<br>"
        + this.oDebugLog;
    }
  }

  private systemDestroy(): void {
    Promise.resolve().then(() => {
      this.debugLog("systemDestroy", "# 1 / 1");

      return Promise.all([
        this.cvDestroy(),
        this.userMediaDestroy(),
      ]);
    }).then(() => {
      this.debugLog("systemDestroy", "# done");
      this.oSystemIsReady = false;
    });
  }

  private systemInit(): void {
    Promise.resolve().then(() => {
      this.debugLog("systemInit", "# 1 / 2");

      return Promise.all([
        this.cvInit(),
        this.userMediaInit(),
      ]);
    }).then(() => {
      this.debugLog("systemInit", "# 2 / 2");

      this.oSystemLoopAt.push(Date.now());
      const update: () => void = () => {
        this.oSystemLoopAt.pop();
        this.oSystemLoopAt.unshift(Date.now());

        this.oSystemFps = Math.round(1000 * (this.oSystemLoopAt.length - 1)
          / (this.oSystemLoopAt[0] - this.oSystemLoopAt[this.oSystemLoopAt.length - 1]));

        this.systemUpdate();
        this.wait(1000 / this.iSystemFps - (Date.now() - this.oSystemLoopAt[0])).then(update);
      };

      this.async(update);
    }).then(() => {
      this.debugLog("systemInit", "# done");
      this.oSystemIsReady = true;
    });
  }

  private systemUpdate(): void {
    this.cvUpdate();
    this.userMediaUpdate();
  }

  private userMediaDestroy(): Promise<any> {
    return Promise.resolve().then(() => {
      this.debugLog("userMediaDestroy", "# done");
      this.oUserMediaIsReady = false;
    });
  }

  private userMediaInit(): Promise<any> {
    return Promise.resolve().then(() => {
      this.debugLog("userMediaInit", "# 1 / 3");

      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          height: this.iUserMediaHeight,
          width: this.iUserMediaWidth,
        },
      });
    }).then((stream: MediaStream) => {
      this.debugLog("userMediaInit", "# 2 / 3");

      return new Promise((resolve: () => void) => {
        const callback: () => void = () => {
          this.eVideo.nativeElement.removeEventListener("loadedmetadata", callback);
          resolve();
        };

        this.eVideo.nativeElement.addEventListener("loadedmetadata", callback);

        this.eVideo.nativeElement.srcObject = stream;
        this.eVideo.nativeElement.play();
      });
    }).then(() => {
      this.debugLog("userMediaInit", "# 3 / 3");

      this.oUserMediaHeight = this.eVideo.nativeElement.videoHeight;
      this.oUserMediaWidth = this.eVideo.nativeElement.videoWidth;
    }).then(() => {
      this.debugLog("userMediaInit", "# done");
      this.oUserMediaIsReady = true;
    });
  }

  private userMediaUpdate(): void {
  }

  private wait(delay: number): Promise<any> {
    return new Promise((resolve: () => void) => {
      setTimeout(resolve, delay);
    });
  }

  private waitUntil(until: () => boolean): Promise<any> {
    return new Promise((resolve: () => void) => {
      const loop: () => void = () => {
        if (until()) {
          this.wait(100).then(loop);
        } else {
          resolve();
        }
      };

      this.async(loop);
    });
  }

}
