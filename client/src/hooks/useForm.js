import { useState, useCallback, useRef } from "react";

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

export const mergeFileList = (a = "", b = "") => {
  const dt = new DataTransfer();
  for (let i = 0; i < a.length; i++) {
    dt.items.add(a[i]);
  }
  if (b.length) {
    for (let i = 0; i < b.length; i++) {
      dt.items.add(b[i]);
    }
  } else if (b) dt.items.add(b);

  return dt.files;
};

export const splitNumberAndText = input => {
  const match = input.match(/^(\d+)(\D+)$/i);
  if (!match) return { number: NaN, text: "" };
  const number = Number(match[1]);
  const text = match[2].toLowerCase();
  return { number, text };
};

export const isFileList = (obj, strict) => {
  return (
    obj &&
    (obj.toString() === "[object FileList]" || (strict ? false : obj.length))
  );
};

const useForm = (config = {}) => {
  const {
    placeholders,
    required,
    exclude,
    returnFormObject,
    returnFilesArray = false,
    mergeFile = false,
    keepNonStrongPwdStatus,
    dataSize,
    strictStateCheck = true,
    maxUpload,
    maxDuration,
    withRequired = true,
    inputsOnly = true
  } = config;
  const [stateChanged, setStateChanged] = useState(!!placeholders);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(placeholders);
  const [errors, setErrors] = useState({});
  const stateRef = useRef({
    inputs: {}
  });

  const deletePathFromObject = (obj, key, dataName, dataType, delInput) => {
    switch (dataType) {
      case "object":
        if (obj[key]) {
          delete obj[key][dataName];
          !Object.keys(obj[key]).length && delete obj[key];
        }
        break;
      default:
        delete obj[key];
        break;
    }
    delInput && delete stateRef.current.inputs[key];
  };

  const handleSubmit = useCallback(
    (e, excludeSet) => {
      if (e && (e.currentTarget || e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (stateChanged || required) {
        if (excludeSet)
          for (const key of excludeSet) {
            delete (inputsOnly ? stateRef.current.inputs : formData)[key];
          }

        let form = returnFormObject ? new FormData() : undefined;

        if (inputsOnly ? Object.keys(stateRef.current.inputs) : formData) {
          const validate = (key, formName, dataType) => {
            let _required;
            if (exclude) {
              _required = !(
                {
                  object: exclude[key]?.[formName]
                }[dataType] ||
                exclude[key] ||
                true
              );
            }
            if (_required === undefined) {
              _required = required
                ? {
                    object: required[key]?.[formName]
                  }[dataType] ||
                  required[key] ||
                  true
                : false;
            }
            if (_required && typeof _required !== "string")
              _required = "required";

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
                let isFilelist;
                if (
                  dataType === "object" ||
                  (isFilelist =
                    stateRef.current[key + "-as-array"] ||
                    isFileList(keyValue, true))
                ) {
                  for (let prop in keyValue) {
                    if (isFilelist) {
                      if (Number(prop) > -1 && keyValue[prop] instanceof File)
                        form.append(`${key}`, keyValue[prop]);
                    } else {
                      if (!form.get(`${key}[${prop}]`))
                        form.append(`${key}[${prop}]`, keyValue[prop]);
                    }
                  }
                } else form.set(key, keyValue);
              }
            } else
              deletePathFromObject(formData, key, formName, dataType, true);
          };

          for (let key in inputsOnly
            ? {
                ...stateRef.current.inputs,
                ...required
              }
            : {
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
        setErrors({
          ...errors
        });
        const _formData = {
          ...formData
        };
        return hasError
          ? null
          : form || (delete _formData.confirmPassword && _formData);
      }
      return null;
    },
    [
      stateChanged,
      errors,
      formData,
      required,
      exclude,
      returnFormObject,
      config.dataType,
      keepNonStrongPwdStatus,
      inputsOnly
    ]
  );

  const handleChange = useCallback(
    (e, validate) => {
      e.stopPropagation();
      const node = e.currentTarget || e.target;
      const key = node.name || node.getAttribute("name") || node.dataset.name;
      const dataType = config.dataType?.[key];
      let {
        name: dataName,
        min: dataMin,
        max: dataMax,
        validateType = "true"
      } = node.dataset;
      validateType = validateType === "true";
      let value =
        node.type === "file"
          ? node.multiple
            ? node.files
            : node.files?.[0]
          : node.value || node.innerText;
      const _required = required
        ? required === true ||
          {
            object: required[key]?.[dataName]
          }[dataType] ||
          required[key]
        : false;
      setFormData((formData = {}) => {
        let lastErr;
        const addError = (error, _key, index) => {
          if (!error) return;
          lastErr = error;
          setErrors(errors => {
            _key = _key || key;
            if (index !== undefined) {
              if (!errors[_key]) errors[_key] = {};
              errors[_key][index] = error;
            } else {
              errors[_key] =
                {
                  object: {
                    ...errors[_key],
                    [dataName]: error
                  }
                }[dataType] || error;
            }
            return {
              ...errors
            };
          });
        };
        setIsSubmitting(false);

        let keyValue =
          {
            object: {
              ...formData?.[key],
              [dataName]: value
            }
          }[dataType] || value;
        setErrors(errors => {
          if (
            errors.all &&
            (Object.keys(formData).length === dataSize ||
              Object.keys(errors).length === dataSize)
          ) {
            delete errors.all;
            errors = {
              ...errors
            };
          }
          return errors;
        });

        if (value || _required) {
          if (node.type === "file") {
            if (!node.multiple || !mergeFile)
              setErrors(errors => {
                delete errors[key];
                delete errors[key + "-duration"];
                delete errors[key + "-upload"];
                return {
                  ...errors
                };
              });
            if (keyValue && (keyValue.length || keyValue.name)) {
              const validateFileMax = (text, type) => {
                let digit;
                const isUp = type === "upload";
                const obj = splitNumberAndText(text);
                const errKey = key + "-" + type;
                if (!obj.number) addError(`max ${type} exceeded`, errKey);
                else {
                  digit = isUp
                    ? { mb: 1000000, gb: 1000000000 }[obj.text]
                    : { s: 1, h: 3600, m: 60 }[obj.text] || NaN;
                  if (digit) digit = obj.number * digit;
                  else addError(`max ${type} exceeded`, errKey);
                }

                if (digit) {
                  if (type === "duration") {
                    const validateDur = (file, index) => {
                      if (
                        file.type.indexOf("video") >= 0 ||
                        file.type.indexOf("audio") >= 0
                      ) {
                        // invalidate key until loaded and validated
                        lastErr = true;
                        const url = URL.createObjectURL(file);
                        const audio = new Audio(url);
                        const metadataListener = () => {
                          if (audio.duration > digit) {
                            addError(
                              `maximum duration exceeded`,
                              errKey,
                              index
                            );
                            if (strictStateCheck) setStateChanged(false);
                          } else
                            setErrors(errors => {
                              detStateChange(errors, 1);
                              return errors;
                            });

                          URL.revokeObjectURL(url);
                          audio.removeEventListener(
                            "loadedmetadata",
                            metadataListener,
                            false
                          );
                        };

                        const errorListener = ({ target: { error } }) => {
                          addError(error, errKey);
                          URL.revokeObjectURL(url);
                          audio.removeEventListener(
                            "error",
                            errorListener,
                            false
                          );
                        };
                        audio.addEventListener(
                          "loadedmetadata",
                          metadataListener,
                          false
                        );
                        audio.addEventListener("error", errorListener, false);
                      }
                    };
                    if (node.multiple) {
                      for (let key in keyValue) {
                        if (Number(key) >= 0) validateDur(keyValue[key], key);
                      }
                    } else validateDur(keyValue);
                  } else {
                    if (node.multiple) {
                      for (let prop in keyValue) {
                        if (Number(prop) >= 0 && keyValue[prop].size > digit)
                          addError(`maximum upload exceeded`, errKey, prop);
                      }
                    } else if (keyValue.size > digit)
                      addError(`maximum upload exceeded`, errKey);
                  }
                }
              };
              if (maxDuration) validateFileMax(maxDuration, "duration");
              if (maxUpload) validateFileMax(maxUpload, "upload");
              if (node.multiple && keyValue) {
                if (mergeFile) {
                  if (returnFilesArray) {
                    stateRef.current[key + "-as-array"] = true;
                    keyValue = Array.from(formData[key] || "").concat(
                      keyValue.length ? Array.from(keyValue) : keyValue
                    );
                  } else mergeFileList(formData[key], keyValue);
                } else if (returnFilesArray) keyValue = Array.from(keyValue);
              }
            } else {
              keyValue = formData[key];
              node.value = "";
            }
          }
        }
        if (_required) {
          if (dataMin) {
            dataMin = Number(dataMin) || 0;
            if (keyValue.length < dataMin) {
              addError(`minimum of ${dataMin} characters`, key);
              if (key === "password" && formData.confirmPassword)
                addError(`password don't match`, "confirmPassword");
            }
          }
        }
        if (dataMax) {
          dataMax = Number(dataMax) || 0;
          if (dataMax && value.length > dataMax) {
            addError(`maximum of ${dataMax}`);
            return formData;
          }
        }
        formData = {
          ...formData,
          [key]: keyValue
        };

        const detStateChange = (errors = { [key]: lastErr }) => {
          let stateChanged = false;
          if (strictStateCheck) {
            const shallowCheck = () => {
              stateChanged = Object.keys(errors).length
                ? false
                : !!(keyValue.length || keyValue.name);
            };
            if (withRequired && isObject(required)) {
              stateChanged = true;
              for (const key in required) {
                if (
                  (key === "password" && validateType && errors[key]
                    ? keepNonStrongPwdStatus
                      ? errors[key]
                      : !(
                          errors[key] === "Weak password" ||
                          errors[key] === "Medium password"
                        )
                    : errors[key]) ||
                  (placeholders || {})[key] === formData[key]
                ) {
                  stateChanged = false;
                  break;
                }
              }
            } else if (lastErr) stateChanged = false;
            else if (placeholders) {
              for (const key in formData) {
                if (placeholders[key] !== formData[key]) {
                  stateChanged = true;
                  break;
                }
              }
            } else shallowCheck();
          } else stateChanged = !Object.keys(formData).length;
          setStateChanged(stateChanged);
        };
        if (value) {
          if (validateType) {
            const withCb = typeof validate === "function";
            const _validate = !(!value && !_required);
            let prop = {
              key,
              value,
              dataName
            };
            switch (node.dataset.controlled === "true" ? "" : key) {
              case "email":
                if (_validate) {
                  if (withCb) {
                    if (isEmail(value)) validate(prop);
                    else {
                      prop.error = "Invalid Email address";
                      validate(prop);
                      addError("Invalid Email address");
                    }
                  } else if (!isEmail(value)) addError("Invalid Email address");
                }
                break;
              case "fullname":
                if (_validate && !isFullName(value))
                  addError("Name must be separated by space");
                break;
              case "phone":
                if (_validate && !isNumber(value))
                  addError("Invalid phone number");
                break;
              case "password":
                if (_validate) {
                  if (dataMin && keyValue.length < dataMin) break;
                  const status = isPassword(value);
                  if (status !== "Strong") addError(`${status} password`);
                  if (formData.confirmPassword) {
                    if (value === formData.confirmPassword)
                      status === "Strong" &&
                        setErrors(errors => {
                          deletePathFromObject(errors, "confirmPassword");
                          return errors;
                        });
                    else addError(`password don't match`, "confirmPassword");
                  }
                }
                break;
              case "confirmPassword":
                if (_validate && value !== formData.password)
                  addError(`password don't match.`);

                break;
              default:
                if (typeof validate === "function")
                  addError(
                    validate({
                      key,
                      value,
                      dataName,
                      validate: _validate
                    })
                  );
                break;
            }
          }
          if (!lastErr)
            setErrors(errors => {
              deletePathFromObject(errors, key, dataName, dataType);

              detStateChange(errors);
              return errors;
            });
          else detStateChange();
        } else {
          if (_required) {
            addError(typeof _required === "string" ? _required : "required");
            detStateChange();
          } else if (formData) {
            deletePathFromObject(formData, key, dataName, dataType, true);
            setErrors(errors => {
              deletePathFromObject(errors, key, dataName, dataType);
              detStateChange(errors, " y ");
              return {
                ...errors
              };
            });
          }
        }

        stateRef.current.inputs[key] = 1;
        return formData;
      });
    },
    [
      config.dataType,
      mergeFile,
      returnFilesArray,
      required,
      dataSize,
      placeholders,
      strictStateCheck,
      maxUpload,
      maxDuration,
      withRequired,
      keepNonStrongPwdStatus
    ]
  );
  const reset = useCallback((formData, config = {}) => {
    setStateChanged(
      typeof config.stateChanged === "boolean" ? config.stateChanged : false
    );
    setIsSubmitting(
      typeof config.isSubmitting === "boolean" ? config.isSubmitting : false
    );
    const isObj = isObject(formData);

    (config.resetErrors === true ||
      (isObj &&
        (config.resetErrors === false
          ? false
          : config.stateChanged !== true))) &&
      setErrors({});
    if (isObj) {
      config.withInput =
        config.withInput === undefined ? true : config.withInput;
      if (config.withInput)
        for (const key in formData) {
          stateRef.current.inputs[key] = 1;
        }
      setFormData(formData);
    } else if (!formData) setFormData({});
  }, []);

  return {
    formData: formData || placeholders || {},
    errors,
    isSubmitting,
    stateChanged,
    handleChange,
    handleSubmit,
    reset,
    setErrors,
    setStateChanged
  };
};

export default useForm;
