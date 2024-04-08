import { Field, FieldAttributes } from "formik";

export function CustomField(props: FieldAttributes<any>) {
  return (
    <div className="mt-2 border-white border-opacity-5 border-[1px] rounded-full p-1 relative">
      <Field
        {...props}
        className="text-white w-full pl-3 py-1 bg-transparent rounded-full focus:outline-0"
      />
    </div>
  )
}