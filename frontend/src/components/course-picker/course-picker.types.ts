/** A course as the course picker shows it; `count` is the number on its chip (paid or enrolled students). */
export interface PickerCourse {
  _id: string;
  title: string;
  coverImage?: string | null;
  status: string;
  count: number;
}
