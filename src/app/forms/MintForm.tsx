import { Field, Form, Formik } from "formik";
import * as Yup from 'yup';
import '@/app/utils/yup'

const MintSchema = Yup.object().shape({
  amount: Yup.number().min(1).required(),
  to: Yup.string().ethereum().required()
});

export interface MintFormValues {
  to: `0x${string}`
  amount: number
}

export function MintForm({ onSubmit }: { onSubmit: (values: MintFormValues) => Promise<void> }) {
  return (
    <Formik
      initialValues={{ amount: 1, to: '' }}
      validationSchema={MintSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, isValid }) => (
        <Form>
          <div className="mt-2 border-white border-opacity-5 border-[1px] rounded-full p-1 relative">
            <Field
              id="to"
              name="to"
              placeholder="0x..."
              className="text-white w-full pl-3 py-1 bg-transparent rounded-full focus:outline-0"
            />
          </div>
          <div className="mt-2 border-white border-opacity-5 border-[1px] rounded-full p-1 relative">
            <Field
              type="number"
              id="amount"
              name="amount"
              placeholder="0"
              className="text-white w-full pl-3 py-1 bg-transparent rounded-full focus:outline-0"
            />
            <button
              type="submit"
              disabled={(isSubmitting || !isValid)}
              className={ 
                `text-white text-sm absolute right-2 top-[50%] -translate-y-2/4 z-1 bg-gray-700 rounded-full py-1 px-4 transition
                ${(isSubmitting || !isValid) ? `opacity-50 cursor-not-allowed` : ``}
                `
              }
            >
              mint
            </button>
          </div>
        </Form>
      )}
    </Formik>
  )
}