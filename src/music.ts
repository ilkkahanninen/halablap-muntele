export let play = () => {
  let ctx = new AudioContext();

  let osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 55;
  osc.start();

  let velocity = ctx.createGain();
  velocity.gain.value = 0;

  let osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 440;
  osc2.start();

  let fmFreq = ctx.createGain();
  fmFreq.gain.value = 440;

  let delay = ctx.createDelay();
  delay.delayTime.value = .5;
  let delayAttenuator = ctx.createGain();
  delayAttenuator.gain.value = .4;

  let fmSynthFilter = ctx.createBiquadFilter();
  fmSynthFilter.type = "highpass";
  fmSynthFilter.frequency.value = 500;
  fmSynthFilter.Q.value = 3;

  let kickOsc = ctx.createOscillator();
  kickOsc.type = "sine";
  kickOsc.start();
  let kickVCA = ctx.createGain();
  kickVCA.gain.value = 0;
  let kickFilter = ctx.createBiquadFilter();
  kickFilter.type = "lowpass";
  kickFilter.frequency.value = 1000;
  kickFilter.Q.value = 2;

  let hhGain = ctx.createGain();
  hhGain.gain.value = 0;
  for (let i = 0; i < 4; i++) {
    let hhOsc = ctx.createOscillator();
    hhOsc.type = "sine";
    hhOsc.frequency.value = 440 + i * i * 567;
    hhOsc.start();
    hhOsc.connect(hhGain);
  }

  // let bufferSize = 2 * ctx.sampleRate,
  //   noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate),
  //   output = noiseBuffer.getChannelData(0);

  // for (let i = 0; i < bufferSize; i++) {
  //   output[i] = Math.random() * 2 - 1;
  // }

  // let whiteNoise = ctx.createBufferSource();
  // whiteNoise.buffer = noiseBuffer;
  // whiteNoise.loop = true;
  // whiteNoise.start();
  // let whiteNoiseVCA = ctx.createGain();
  // whiteNoiseVCA.gain.value = 0;

  let bassLead = ctx.createOscillator();
  bassLead.type = "sawtooth";
  bassLead.frequency.value = 55;
  bassLead.start();
  let bassLeadFilter = ctx.createBiquadFilter();
  bassLeadFilter.type = "lowpass";
  bassLeadFilter.Q.value = 1.5;
  bassLeadFilter.frequency.value = 0;
  let bassLeadVCA = ctx.createGain();
  bassLeadVCA.gain.value = .2;

  let compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.attack.value = 0;
  compressor.release.value = .1;
  compressor.ratio.value = 12;

  let compGain = ctx.createGain();
  compGain.gain.value = 2;

  // let compressor2 = ctx.createDynamicsCompressor();
  // compressor.attack.value = 0.02;
  // compressor.release.value = 0.3;
  // compressor.knee.value = 0.2;
  // compressor.ratio.value = 4.0;

  let masterFilter = ctx.createBiquadFilter();
  masterFilter.type = "lowpass";

  osc2.connect(fmFreq).connect(osc.frequency);
  osc.connect(velocity).connect(fmSynthFilter).connect(compressor);
  fmSynthFilter.connect(delay).connect(delayAttenuator).connect(compressor);
  delayAttenuator.connect(delay);
  kickOsc.connect(kickVCA).connect(kickFilter).connect(compressor);
  hhGain.connect(compressor);
  // whiteNoise.connect(hhGain);
  // whiteNoise.connect(whiteNoiseVCA);
  // whiteNoiseVCA.connect(compressor);
  // whiteNoiseVCA.connect(delay);
  bassLead.connect(bassLeadFilter).connect(bassLeadVCA).connect(compressor);
  compressor
    .connect(masterFilter)
    .connect(compGain) /*.connect(compressor2)*/
    .connect(ctx.destination);

  let scheduleNote = (step: number, time: number) => {
    let currentTime = ctx.currentTime + time;

    if (step % 32 != 31) {
      kickOsc.frequency.setValueCurveAtTime(
        [110, 40, 10, 55],
        currentTime,
        0.2
      );
      kickVCA.gain.setValueCurveAtTime(
        [0, 1, .05, .1, .5],
        currentTime,
        .1
      );
      kickFilter.frequency.setValueCurveAtTime([1000, 10], currentTime, .1);
    }

    osc.frequency.exponentialRampToValueAtTime(
      25.5 * Math.pow(2, step % 4),
      currentTime
    );
    osc2.frequency.exponentialRampToValueAtTime(
      55.5 * Math.pow(2, step % 3),
      currentTime
    );

    if (step >= 32) {
      hhGain.gain.setValueCurveAtTime([.006, 0], currentTime + .1, .01);
      hhGain.gain.setValueCurveAtTime([.006, 0], currentTime + .3, .01);
    }
    hhGain.gain.setValueCurveAtTime([.008, 0], currentTime + .2, .02);

    // if (step % 4 == 1) {
    //   whiteNoiseVCA.gain.setValueCurveAtTime(
    //     [0.01, 0.001, 0, 0.01, 0],
    //     currentTime + 0.2,
    //     0.4
    //   );
    // }

    if (step >= 64) {
      bassLead.frequency.exponentialRampToValueAtTime(
        55,
        currentTime + .2
      );
      bassLeadFilter.frequency.setValueCurveAtTime(
        [1110, 0],
        currentTime + .2,
        .1
      );
      bassLeadVCA.gain.setValueCurveAtTime(
        [0, .02, .01, .05, 0],
        currentTime + .2,
        .1
      );
    }

    if (step >= 32) {
      velocity.gain.setValueCurveAtTime(
        [.01, 0, .1, 0].map((v) => v * Math.min((step - 32) / 64, 1)),
        currentTime + .2,
        .2
      );

      // osc.type = "sine";
      if (step % 2 == 0) {
        // osc.type = "triangle";
        fmFreq.gain.setValueCurveAtTime([1600, 25.5], currentTime + .2, .2);
      } else if (step % 4 == 0) {
        fmFreq.gain.setValueCurveAtTime(
          [440, 0],
          currentTime + .2,
          .2
        );
      }

      fmSynthFilter.frequency.exponentialRampToValueAtTime(
        1000 + 200 * (Math.floor(step / 4) % 4),// - 100 * Math.sin(step),
        currentTime
      );
    }
  };

  for (let i = 0; i < 256; i++) {
      scheduleNote(i,  i * 0.4);
  };

  masterFilter.frequency.setValueCurveAtTime(
    [0.1, 16000],
    0,
    12.8 /* 0.4 * 32 */
  );
  masterFilter.frequency.setValueCurveAtTime(
    [16000, 0.1],
    89.6 /* 0.4 * 224 */,
    12.8 /* 0.4 * 32 */
  );

  return ctx;
};
