import Select from "../ui/Select.jsx";
import { fullName } from "../../utils/formatters.js";

export default function StudentSelect({ students, value, onChange }) {
  return (
    <Select label="תלמיד" value={value} onChange={(e) => onChange(e.target.value)}>
      {students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
    </Select>
  );
}
