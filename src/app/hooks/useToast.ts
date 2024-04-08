import t from "react-hot-toast";

export default function useToast() {
  function asyncToast<T>(promise: Promise<T>, successMessage: string) {
    t.promise<T>(
      promise,
      {
       loading: 'Loading',
       success: () => successMessage,
       error: (err) => err.shortMessage,
      },
      {
       style: {
         minWidth: '250px',
         backgroundColor: 'rgb(55 65 81)',
         color: '#fff'
       },
       success: {
         duration: 2000
       },
       error: {
         duration: 2000
       },
       position: 'top-left'
      }
    )
  }

  function successToast(message: string) {
    t.success(message, {
      style: {
        minWidth: '250px',
        backgroundColor: 'rgb(55 65 81)',
        color: '#fff'
      },
      position: 'top-left'
     })
  }

  return {
    asyncToast,
    successToast
  }
}