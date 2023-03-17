import { useState, useCallback, useMemo } from "react";

export const isEmail = str => {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(
    str
  );
};
export const isFullName = str => {
  return /\w+(\s|-|')+\w+/.test(str);
};

export const isNumber = str => {
  return /(\d+){10,13}/.test(str);
};

export const isPassword = str => {
  let strongPassword = new RegExp(
    "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})"
  );
  let mediumPassword = new RegExp(
    "((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))"
  );
  if (strongPassword.test(str)) return "Strong";
  else if (mediumPassword.test(str)) return "Medium";
  else return "Weak";
};

export const isObject = obj =>
  obj &&
  typeof obj === "object" &&
  (obj.toString
    ? obj.toString() === "[object Object]"
    : obj.length === undefined);

export const isLink = str => {
  try {
    return Boolean(new URL(str));
  } catch (e) {
    return false;
  }
};

export const mergeFileList = (a, b) => {
  const dt = new DataTransfer();
  const { files } = a;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    dt.items.add(file);
  }
  return dt.files;
};

export const isFileList = obj => {
  return obj && obj.toString() === "[object FileList]";
};

const useForm = (config = {}) => {
  const [
    {
      placeholders,
      required = true,
      exclude,
      returnFormObject,
      returnFilesArray = false,
      mergeFile = false,
      formAppendMap = {},
      appendSkipKey,
      keepNonStrongPwdStatus
    },
    setConfig
  ] = useState(config);
  const [stateChanged, setStateChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [formData, setFormData] = useState(placeholders);
  const [errors, setErrors] = useState({});
  const deletePathFromObject = (obj, key, dataName, dataType) => {
    if (!obj[key]) return;
    switch (dataType) {
      case "object":
        delete obj[key][dataName];
        !Object.keys(obj[key]).length && delete obj[key];
        break;
      default:
        delete obj[key];
        break;
    }
  };
  const handleSubmit = useCallback(
    e => {
      try {
        // console.log("handle submit", stateChanged, errors);
        if (e && (e.currentTarget || e.target)) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (stateChanged || required) {
          let form = returnFormObject ? new FormData() : undefined;
          if (formData) {
            const validate = (key, formName, dataType) => {
              // // console.log(
              //   key,
              //   formName,
              //   dataType,
              //   required,
              //   formData,
              //   "data-key"
              // );
              let _required =
                (exclude &&
                  (!{
                    object: exclude[key]?.[formName]
                  }[dataType] ||
                    exclude[key])) ||
                required === true ||
                ({
                  object: required[key]?.[formName]
                }[dataType] ||
                  required[key]);
              _required =
                typeof _required === "string" ? _required : "required";

              const keyValue =
                {
                  object: formData[key]
                }[dataType] || formData[key];

              const errValue =
                {
                  object: errors[key]?.[formName]
                }[dataType] || errors[key];
              if (
                keyValue
                  ? !(keyValue[formName] || keyValue) && _required
                  : _required
              ) {
                if (formName) errors[key][formName] = _required;
                else errors[key] = _required;
              } else if (
                !keepNonStrongPwdStatus &&
                (errValue === "Weak password" || errValue === "Medium password")
              )
                deletePathFromObject(errors, key, formName, dataType);
              if (keyValue) {
                if (form) {
                  if (
                    {
                      object: true
                    }[dataType] ||
                    isFileList(keyValue) ||
                    formAppendMap[key]
                  ) {
                    for (let i = 0; i < keyValue.length; i++) {
                      const item = keyValue[i];
                      if (
                        !appendSkipKey ||
                        item[appendSkipKey] !== undefined ||
                        item instanceof File
                      ) {
                        switch (dataType) {
                          case "object":
                            if (!form.get(`${key}[${keyValue[i]}]`))
                              form.append(`${key}[${keyValue[i]}]`, item);
                            break;
                          default:
                            form.append(key, item);
                            break;
                        }
                      }
                    }
                  } else form.set(key, keyValue);
                }
              } else deletePathFromObject(formData, key, formName, dataType);
            };

            for (let key in {
              ...formData,
              ...required
            }) {
              const dataType = config.dataType?.[key];
              switch (dataType) {
                case "object":
                  for (let _key in formData[key]) {
                    validate(key, _key, dataType);
                  }
                  break;
                default:
                  validate(key);
                  break;
              }
            }
          } else if (required === true) {
            errors.all = "required";
          } else if (required) {
            for (const key in required) {
              errors[key] =
                typeof required[key] === "string" ? required[key] : "required";
            }
          }
          const hasError = Object.keys(errors).length;
          !hasError && setIsSubmitting(true);
          setErrors(errors);
          // console.log(errors, formData, "has eror");
          return hasError ? null : form || formData;
        }
        return null;
      } catch (err) {
        // console.log(err, " use form err");
      }
    },
    [
      stateChanged,
      errors,
      formData,
      required,
      exclude,
      returnFormObject,
      formAppendMap,
      appendSkipKey,
      config.dataType,
      keepNonStrongPwdStatus
    ]
  );

  const handleChange = useCallback(
    (e, validate) => {
      e.stopPropagation();
      const node = e.currentTarget || e.target;
      const key = node.name;
      const dataType = config.dataType?.[key];
      let { name: dataName, min: dataMin, max: dataMax } = node.dataset;
      let value =
        node.type === "file"
          ? node.multiple
            ? node.files
            : node.files?.[0]
          : node.value;
      const _required =
        required === undefined ||
        required === true ||
        ({
          object: required[key]?.[dataName]
        }[dataType] ||
          required[key]);

      let isValid = true;
      setFormData(formData => {
        const addError = (error, _key) => {
          if (!error) return;
          isValid = false;
          setErrors(errors => ({
            ...errors,
            [_key || key]:
              {
                object: {
                  ...errors[key],
                  [dataName]: error
                }
              }[dataType] || error
          }));
        };
        setIsSubmitting(false);
        setStateChanged(
          !!(formData
            ? Object.keys(formData).length - 1 || value.length || value.name
            : true)
        );
        let keyValue = "";
        if (value || _required) {
          if (node.type === "file" && node.multiple && formData) {
            keyValue =
              {
                object: formData[key]?.[dataName]
              }[dataType] || formData[key];
            if (mergeFile && keyValue) {
              if (returnFilesArray)
                keyValue = Array.from(value).concat(keyValue);
              else mergeFileList(value, keyValue);
            } else if (returnFilesArray) keyValue = Array.from(value);
          } else {
            keyValue =
              {
                object: {
                  ...formData?.[key],
                  [dataName]: value
                }
              }[dataType] || value;
          }
        }

        formData = {
          ...formData,
          [key]: keyValue
        };

        // // console.log(value, key, _required);
        if (value) {
          dataMin = Number(dataMin) || 0;
          if (dataMin && value.length < dataMin) {
            addError(`minimum of ${dataMin}`);
            return formData;
          }
          if (dataMax && value.length > dataMax) {
            addError(`maximum of ${dataMax}`);
            return formData;
          }
          switch (node.dataset.controlled === "true" ? "" : key) {
            case "email":
              if (!isEmail(value)) addError("Invalid Email");
              break;
            case "fullname":
              if (!isFullName(value))
                addError("Name must be separated by space");
              break;
            case "phone":
              if (!isNumber(value)) addError("Invalid phone number");
              break;
            case "password":
              const status = isPassword(value);
              if (status !== "Strong") addError(`${status} password`);
              if (formData.confirmPassword) {
                if (value === formData.confirmPassword)
                  setErrors(errors => {
                    deletePathFromObject(errors, "confirmPassword");
                    return errors;
                  });
                else addError(`password don't match`, "confirmPassword");
              }
              break;
            case "confirmPassword":
              if (value !== formData.password)
                addError(`password don't match.`);
              break;
            default:
              if (typeof validate === "function")
                addError(validate(key, value, dataName));
              break;
          }

          if (isValid)
            setErrors(errors => {
              deletePathFromObject(errors, key, dataName, dataType);
              return errors;
            });
        } else {
          if (_required)
            addError(typeof _required === "string" ? _required : "required");
          else if (formData)
            deletePathFromObject(formData, key, dataName, dataType);
        }
        return formData;
      });
      return isValid;
    },
    [config.dataType, mergeFile, returnFilesArray, required]
  );
  const reset = useCallback((formData, config = {}) => {
    setStateChanged(config.stateChanged || !!formData);
    setIsSubmitting(config.isSubmitting || false);
    if (isObject(formData)) setFormData(formData);
    else if (!formData) setFormData({});
  }, []);
  return {
    formData: formData || {},
    errors,
    isSubmitting,
    stateChanged,
    handleChange,
    handleSubmit,
    reset
  };
};

export default useForm;
