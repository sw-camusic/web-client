import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-part-play",
  styleUrls: ["./part-play.component.css"],
  templateUrl: "./part-play.component.html",
})
export class PartPlayComponent implements AfterViewInit, OnDestroy, OnInit {

  public iAudioCacheDepth: number;
  public iAudioSrcList: string[];

  public iCvAThreshold: number;
  public iCvDistanceThreshold: number;
  public iCvHigh: number[];
  public iCvLow: number[];
  public iCvRadiusMax: number;
  public iCvRadiusMin: number;
  public iCvSrc: string;
  public iCvYThreshold: number;

  public iDebugMode: boolean;

  public iSystemFps: number;
  public iSystemHeight: number;
  public iSystemWidth: number;

  public oCvIsReady: boolean;

  public oDebugLog: string;

  public oSystemFps: number;
  public oSystemHeight: number;
  public oSystemLoopAt: number[];
  public oSystemWidth: number;

  @ViewChild("video")
  private eVideo: ElementRef;

  private mAudioCache: HTMLAudioElement[][];

  private mCv: any;
  private mCvAnchor: any;
  private mCvCap: any;
  private mCvHigh: any;
  private mCvLow: any;
  private mCvM: any;
  private mCvMorphologyDefaultBorderValue: any;
  private mCvTrackingLog: { x: number, y: number }[][];

  public constructor() {
    this.iAudioCacheDepth = 8;
    this.iAudioSrcList = [
      "/assets/audio/c.mp3",
      "/assets/audio/d.mp3",
      "/assets/audio/e.mp3",
      "/assets/audio/f.mp3",
      "/assets/audio/g.mp3",
      "/assets/audio/a.mp3",
      "/assets/audio/b.mp3",
    ];

    this.iCvAThreshold = 0.02;
    this.iCvDistanceThreshold = 400;
    this.iCvHigh = [255, 86, 86, 255];
    this.iCvLow = [160, 4, 4, 0];
    this.iCvRadiusMax = 80;
    this.iCvRadiusMin = 8;
    this.iCvSrc = "/assets/opencv.js";
    this.iCvYThreshold = 450;

    this.iDebugMode = !environment.production;

    this.iSystemFps = 30;
    this.iSystemHeight = 720;
    this.iSystemWidth = 1280;

    this.oCvIsReady = false;

    this.oDebugLog = "";

    this.oSystemFps = 0;
    this.oSystemHeight = 0;
    this.oSystemLoopAt = [0, 0, 0, 0, 0, 0, 0, 0];
    this.oSystemWidth = 0;
  }

  public ngAfterViewInit(): void {
    this.async(() => {
      this.debugInit();
      this.systemInit();
      this.audioInit();
      this.cvInit();
    });
  }

  public ngOnDestroy(): void {
    this.async(() => {
      this.cvDestroy();
      this.audioDestroy();
      this.systemDestroy();
      this.debugDestroy();
    });
  }

  public ngOnInit(): void {
  }

  private async(fn: () => void): Promise<any> {
    return this.wait(0).then(fn);
  }

  private audioDestroy(): void {
    this.debugLog("audio", "destroy ....");
    this.debugLog("audio", "destroy done");
  }

  private audioInit(): void {
    this.debugLog("audio", "init ....");

    this.audioReCache();

    this.debugLog("audio", "init done");
  }

  private audioPlay(index: number): void {
    if (index < 0 || this.iAudioSrcList.length <= index) {
      return;
    }

    const cache: HTMLAudioElement | undefined = this.mAudioCache[index].shift();
    if (cache !== undefined) {
      cache.play();
    }

    const audio: HTMLElement | null = document.querySelector(`audio[src="${this.iAudioSrcList[index]}"]`);
    if (audio !== null) {
      this.mAudioCache[index].push(<HTMLAudioElement> audio.cloneNode());
    }
  }

  private audioReCache(): void {
    this.mAudioCache = [];
    this.iAudioSrcList.forEach((src: string, index: number) => {
      this.mAudioCache[index] = [];

      const audio: HTMLElement | null = document.querySelector(`audio[src="${src}"]`);
      if (audio !== null) {
        for (let i: number = 0; i < this.iAudioCacheDepth; i++) {
          this.mAudioCache[index].push(<HTMLAudioElement> audio.cloneNode());
        }
      }
    });
  }

  private cvDestroy(): void {
    this.debugLog("cv", "destroy ....");

    this.mCvHigh.delete();
    this.mCvLow.delete();
    this.mCvM.delete();

    this.debugLog("cv", "destroy done");
  }

  private cvInit(): void {
    this.debugLog("cv", "init ....");

    const script: HTMLElement = document.createElement("script");
    script.setAttribute("async", "");
    script.setAttribute("src", this.iCvSrc);
    this.eVideo.nativeElement.parentElement.appendChild(script);

    this.oSystemLoopAt.push(Date.now());
    const cvLoop: () => void = () => {
      this.oSystemLoopAt.pop();
      this.oSystemLoopAt.unshift(Date.now());

      this.oSystemFps = Math.round(1000 * (this.oSystemLoopAt.length - 1)
        / (this.oSystemLoopAt[0] - this.oSystemLoopAt[this.oSystemLoopAt.length - 1]));

      this.cvUpdate();
      this.wait(1000 / this.iSystemFps - (Date.now() - this.oSystemLoopAt[0])).then(cvLoop);
    };

    const cvWait: () => void = () => {
      if (window["cv"] === undefined
        || window["cv"].Mat === undefined
        || this.oSystemHeight === 0
        || this.oSystemWidth === 0) {
        this.wait(100).then(cvWait);
      } else {
        this.mCv = window["cv"];
        this.mCvAnchor = new this.mCv.Point(-1, -1);
        this.mCvCap = new this.mCv.VideoCapture(this.eVideo.nativeElement);
        this.mCvHigh = new this.mCv.Mat(this.oSystemHeight, this.oSystemWidth, this.mCv.CV_8UC4, this.iCvHigh);
        this.mCvLow = new this.mCv.Mat(this.oSystemHeight, this.oSystemWidth, this.mCv.CV_8UC4, this.iCvLow);
        this.mCvM = this.mCv.Mat.ones(5, 5, this.mCv.CV_8U);
        this.mCvMorphologyDefaultBorderValue = this.mCv.morphologyDefaultBorderValue();
        this.mCvTrackingLog = [];

        this.oCvIsReady = true;

        this.debugLog("cv", "init done");

        this.async(cvLoop);
      }
    };

    this.async(cvWait);
  }

  private cvUpdate(): void {
    const contours: any = new this.mCv.MatVector();
    const hierarchy: any = new this.mCv.Mat();
    const src: any = new this.mCv.Mat(this.oSystemHeight, this.oSystemWidth, this.mCv.CV_8UC4);

    this.mCvCap.read(src);

    this.mCv.flip(src, src, 1);
    this.mCv.inRange(src, this.mCvLow, this.mCvHigh, src);
    this.mCv.erode(src, src, this.mCvM, this.mCvAnchor, 1, this.mCv.BORDER_CONSTANT, this.mCvMorphologyDefaultBorderValue);
    this.mCv.dilate(src, src, this.mCvM, this.mCvAnchor, 1, this.mCv.BORDER_CONSTANT, this.mCvMorphologyDefaultBorderValue);
    this.mCv.findContours(src, contours, hierarchy, this.mCv.RETR_LIST, this.mCv.CHAIN_APPROX_SIMPLE);

    const nextTrackingLog: { x: number, y: number }[][] = [];
    const playList: number[] = [];

    const t0: number = this.oSystemLoopAt[2];
    const t1: number = this.oSystemLoopAt[1];
    const t2: number = this.oSystemLoopAt[0];
    const t3: number = this.oSystemLoopAt[0] + 1 / this.oSystemFps;

    for (let i: number = 0; i < contours.size(); i++) {
      const circle: any = this.mCv.minEnclosingCircle(contours.get(i));

      if (this.iCvRadiusMin < circle.radius && circle.radius < this.iCvRadiusMax) {
        let dMin: number = this.iCvDistanceThreshold * this.iCvDistanceThreshold;
        let index: number | null = null;

        this.mCvTrackingLog.forEach((value: { x: number, y: number }[], idx: number) => {
          const d: number = (circle.center.x - value[0].x) * (circle.center.x - value[0].x)
            + (circle.center.y - value[0].y) * (circle.center.y - value[0].y);
          if (dMin > d) {
            dMin = d;
            index = idx;
          }
        });

        if (index !== null) {
          const log: { x: number, y: number }[] = this.mCvTrackingLog[index].slice(0, 2);
          log.unshift({ x: circle.center.x, y: circle.center.y });

          if (log.length >= 3) {
            const dy0: number = log[1].y - log[2].y;
            const dy1: number = log[0].y - log[1].y;
            const dvy0: number = dy0 / (t1 - t0);
            const dvy1: number = dy1 / (t2 - t1);
            const day: number = (dvy1 - dvy0) / (t2 - t1);
            const dvy2: number = day * (t3 - t2) + dvy1;
            const dy2: number = dvy2 * (t3 - t2);
            const y2: number = log[0].y + dy2;

            if (day > this.iCvAThreshold && y2 > this.iCvYThreshold) {
              const dx0: number = log[1].x - log[2].x;
              const dx1: number = log[0].x - log[1].x;
              const dvx0: number = dx0 / (t1 - t0);
              const dvx1: number = dx1 / (t2 - t1);
              const dax: number = (dvx1 - dvx0) / (t2 - t1);
              const dvx2: number = dax * (t3 - t2) + dvx1;
              const dx2: number = dvx2 * (t3 - t2);
              const x2: number = log[0].x + dx2;

              playList.push(Math.round(x2 * this.iAudioSrcList.length / this.oSystemWidth));
            }
          }

          nextTrackingLog.push(log);
        } else {
          nextTrackingLog.push([{ x: circle.center.x, y: circle.center.y }]);
        }
      }
    }

    this.mCvTrackingLog = nextTrackingLog;

    this.async(() => {
      playList.filter((value: number, i: number, array: number[]) => {
        return array.indexOf(value) === i;
      }).forEach((value: number) => {
        this.audioPlay(value);
      });
    });

    if (this.iDebugMode) {
      const dst: any = new this.mCv.Mat.zeros(this.oSystemHeight, this.oSystemWidth, this.mCv.CV_8UC4);
      const dstColor: any = [
        new this.mCv.Scalar(255, 255, 255, 255),
        new this.mCv.Scalar(0, 255, 255, 255),
        new this.mCv.Scalar(0, 0, 255, 255),
      ];

      this.mCvTrackingLog.forEach((value: { x: number, y: number }[]) => {
        value.forEach((v: { x: number, y: number }, i: number) => {
          this.mCv.circle(dst, { x: v.x, y: v.y }, 10, dstColor[i]);
        });
      });

      this.mCv.imshow("canvas", dst);
      dst.delete();
    }

    contours.delete();
    hierarchy.delete();
    src.delete();
  }

  private debugDestroy(): void {
  }

  private debugInit(): void {
  }

  private debugLog(label: string, message: string): void {
    if (this.iDebugMode) {
      this.oDebugLog = new Date().toISOString()
        + " ["
        + (label + "        ").substring(0, 8)
        + "]: "
        + message
        + "<br>"
        + this.oDebugLog;
    }
  }

  private systemDestroy(): void {
    this.debugLog("system", "destroy ....");
    this.debugLog("system", "destroy done");
  }

  private systemInit(): void {
    this.debugLog("system", "init ....");

    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        height: this.iSystemHeight,
        width: this.iSystemWidth,
      },
    }).then((stream: MediaStream) => {
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
      this.oSystemHeight = this.eVideo.nativeElement.videoHeight;
      this.oSystemWidth = this.eVideo.nativeElement.videoWidth;

      this.debugLog("system", "init done");
    });
  }

  private wait(delay: number): Promise<any> {
    return new Promise((resolve: () => void) => {
      setTimeout(resolve, delay);
    });
  }

}
