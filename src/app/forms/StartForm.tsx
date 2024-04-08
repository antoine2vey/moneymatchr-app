import { Form, Formik } from "formik";
import * as Yup from 'yup';
import '@/app/utils/yup'
import { CustomField } from "../components/form/Field";

const StartSchema = Yup.object().shape({
  opponent: Yup.string().ethereum().required(),
  amount: Yup.number().min(1).required(),
  maxMatches: Yup.number().min(1).required().test(
    "oddNumber",
    "Match number must be odd",
    (value) => typeof value === 'number' && value % 2 !== 0
  )
});

export interface StartFormValues {
  opponent: `0x${string}`
  amount: number
  maxMatches: number
}

export function StartForm({ onSubmit }: { onSubmit: (values: StartFormValues) => Promise<void> }) {
  return (
    <Formik
      initialValues={{ opponent: '', maxMatches: '', amount: '' }}
      onSubmit={onSubmit}
      validationSchema={StartSchema}
      validateOnMount
    >
      {({ isSubmitting, isValid }) => (
        <Form>
          <CustomField
            type="text"
            id="opponent"
            name="opponent"
            placeholder="0x..."
          />
          <CustomField
            type="number"
            id="maxMatches"
            name="maxMatches"
            placeholder="0"
            min="1"
          />
          <CustomField
            type="number"
            id="amount"
            name="amount"
            placeholder="0"
            min="1"
          />

          <button
            type="submit"
            disabled={(isSubmitting || !isValid)}
            className={ 
              `text-white mt-2 bg-gray-600 rounded-full py-1 px-4 transition
              ${(isSubmitting || !isValid) ? `opacity-50 cursor-not-allowed` : ``}
              `
            }
          >
            start
          </button>
        </Form>
      )}
    </Formik>
  )
}