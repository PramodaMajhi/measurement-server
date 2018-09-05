export interface IMeasurement {
    value: string,
    uom: string,
    source: string
}
  
export interface IData {
    DOB: string,                  // "1966-11-11"
    BiologicalSex: string,        // "Male"
    BloodType: string,            // "B+"
    FitzpatrickSkinType: string,  // "II"
    WheelchairUse: string,        // "no",
    Weight: IMeasurement,         // { "value":"99.34", "uom":"Kg", "source":""  },
    Height: IMeasurement,         // { "value":"1.70",  "uom":"M", "source":"" },
    HeartRateVariability: IMeasurement // { "value":"21", "uom":"Ms", "source":""},
    RestingHeartRate: IMeasurement     // {"value":"74","uom":"Bpm","source":""},
    SleepHours: IMeasurement           // {"value":"7h 0m","uom":"Hour","source":""},
    StepsCount: IMeasurement           // {"value":"1539","uom":"Count","source":""},
    HeartRate: IMeasurement            // {"value":"84","uom":"Bpm","source":"Apple Watch"}
}