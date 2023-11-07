import { useState, useCallback } from "react";
import { isObject, withMapObj } from "utils/validators";

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
  if (
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      str
    )
  )
    return "Strong";
  else if (/(?=.*[a-zA-Z]).{8,}/.test(str)) return "Medium";
  else return "Weak";
};

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

export const isFileList = obj => {
  return (
    obj && (obj.toString() === "[object FileList]" || obj[0] instanceof File)
  );
};

const useForm = config => {
  const {
    placeholders,
    required,
    returnFilesArray = false,
    mergeFile = false,
    dataSize,
    dataType: dataTypeMap,
    maxUpload,
    maxDuration,
    withInvalidField,
    stateCheck = true,
    withStrongPwdOnly
  } = config || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(placeholders || {});
  const [errors, setErrors] = useState({});

  const deletePathFromObject = (obj, key, dataName, dataType) => {
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
    return obj;
  };

  const handleSubmit = useCallback(
    (e, options = {}) => {
      try {
        const {
          formData: form,
          validateTypeMap,
          errDelMap,
          withStrongPwdOnly,
          bareMessage,
          excludeMap,
          errMap
        } = options;
        if (e && (e.currentTarget || e.target)) {
          e.preventDefault();
          e.stopPropagation();
        }
        let withErr;

        setIsSubmitting(true);

        const validate = (key, dataName, dataType) => {
          if (
            {
              ...excludeMap,
              confirmPassword: true
            }[key]
          )
            deletePathFromObject(formData, key, dataName, dataType);
          else {
            const keyValue =
              {
                object: formData[key]?.[dataName]
              }[dataType] || formData[key];
            if (keyValue) {
              const _key = dataName || key;

              if (
                errDelMap
                  ? errDelMap[key]
                  : !withStrongPwdOnly && key === "password"
              )
                delete errors[key];
              else if (validateTypeMap && !errors[_key]) {
                switch (validateTypeMap[key]) {
                  case "email":
                    if (!isEmail(keyValue)) {
                      errors[_key] = "Invalid Email address";
                      withErr = true;
                    }
                    break;
                  case "password":
                    const status = isPassword(keyValue);
                    if (withStrongPwdOnly && status !== "Strong") {
                      errors[_key] = `${status} password`;
                      withErr = true;
                    }
                    if (formData.confirmPassword) {
                      if (keyValue === formData.confirmPassword)
                        delete errors.confirmPassword;
                      else errors.confirmPassword = `password don't match`;
                    }
                    break;
                  case "confirmPassword":
                    if (keyValue !== formData.password) {
                      errors[key] = `password don't match.`;
                      withErr = true;
                    }
                    break;
                  default:
                    if (errMap) {
                      withErr = true;
                      for (const key in errMap) {
                        errors[key] = errMap[key];
                      }
                    }
                    break;
                }
              }

              if (!withErr) {
                if (form?.append) {
                  if (
                    dataType === "array" ||
                    dataType === "fileList" ||
                    isFileList(keyValue)
                  ) {
                    for (const prop in keyValue) {
                      if (Number(prop) > -1 && keyValue[prop])
                        form.append(`${key}`, keyValue[prop]);
                    }
                  } else if (dataType === "object")
                    form.append(`${key}[${dataName}]`, keyValue);
                  else form.set(key, keyValue);
                }
              }
            } else {
              if (required) {
                withErr = true;

                errors[dataName || key] =
                  required[dataName || key] ||
                  (bareMessage
                    ? "required"
                    : `${(dataName || key).slice(0, 1).toUpperCase()}${(
                        dataName || key
                      ).slice(1)} is required`);
              } else if (!withInvalidField) {
                deletePathFromObject(formData, key, dataName, dataType, true);
                setErrors(errors => {
                  deletePathFromObject(errors, key, dataName, dataType);
                  return {
                    ...errors
                  };
                });
              }
            }
          }
        };
        if (formData)
          for (const key in {
            ...formData,
            ...(required === true ? {} : required)
          }) {
            const dataType = dataTypeMap?.[key];

            switch (dataType) {
              case "object":
                for (const _key in formData[key]) {
                  validate(key, _key, dataType);
                }
                break;
              default:
                validate(key);
                break;
            }
          }
        else {
          withErr = true;
          errors.all = true;
        }

        if (withErr) setErrors({ ...errors });

        return !required || !withErr
          ? form?.append
            ? form
            : form
            ? Object.assign(form, formData)
            : formData
          : null;
      } catch (err) {
        console.error(err);
      }
    },
    [formData, required, withInvalidField, errors, dataTypeMap]
  );

  const handleChange = useCallback(
    (e, validate) => {
      e.stopPropagation();
      const node = e.currentTarget || e.target;
      const key = node.name || node.dataset.name || node.getAttribute("name");
      const dataType = dataTypeMap?.[key];

      let {
        name: dataName,
        min: dataMin,
        max: dataMax,
        validateType = "true",
        innerText
      } = node.dataset;

      validateType = validateType === "true";
      innerText = innerText === "true";

      const value =
        node.type === "file"
          ? node.multiple
            ? node.files
            : node.files?.[0]
          : node.value || (innerText ? node.innerText : "");

      const _required = required
        ? required === true ||
          {
            object: required[key]?.[dataName]
          }[dataType] ||
          required[key]
        : false;

      setFormData((formData = {}) => {
        let withErr;

        const addError = (error, _key, index) => {
          if (!error) return;
          withErr = true;

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

        if (keyValue || _required) {
          if (_required && !keyValue)
            addError(
              typeof _required === "string"
                ? _required
                : `${key.slice(0, 1).toUpperCase()}${key.slice(1)} is required`,
              key
            );
          else {
            if (dataMin) {
              dataMin = Number(dataMin) || 0;
              if (keyValue.length < dataMin) {
                addError(`Minimum of ${dataMin} characters`, key);
                if (key === "password" && formData.confr)
                  addError(`Password don't match`, "confirmPassword");
              }
            }

            if (dataMax) {
              dataMax = Number(dataMax) || 0;
              if (dataMax && keyValue.length > dataMax) {
                keyValue = formData[key];
                withErr = true;
              }
            }

            if (node.type === "file") {
              validateType = false;
              const validateFileMax = (text, type) => {
                let digit;
                const isUp = type === "upload";
                const obj = splitNumberAndText(text);
                const errKey = key + "-" + type;
                if (!obj.number) addError(`Maximum ${type} exceeded`, errKey);
                else {
                  digit = isUp
                    ? { mb: 1000000, gb: 1000000000 }[obj.text]
                    : { s: 1, h: 3600, m: 60 }[obj.text] || NaN;
                  if (digit) digit = obj.number * digit;
                  else addError(`Maximum ${type} exceeded`, errKey);
                }

                if (digit) {
                  if (type === "duration") {
                    const validateDur = (file, index) => {
                      if (
                        file.type.indexOf("video") >= 0 ||
                        file.type.indexOf("audio") >= 0
                      ) {
                        // invalidate key until loaded and validated
                        withErr = true;
                        setErrors(errors => {
                          if (index > -1) {
                            if (!errors[errKey]) errors[errKey] = {};
                            errors[errKey][index] = "";
                          } else errors[errKey] = "";
                          return {
                            ...errors
                          };
                        });
                        const url = URL.createObjectURL(file);
                        const audio = new Audio(url);
                        const metadataListener = () => {
                          if (audio.duration > digit) {
                            addError(
                              `Maximum duration exceeded`,
                              errKey,
                              index
                            );
                          } else
                            setErrors(errors => {
                              if (errors[errKey] !== undefined) {
                                if (index > -1) {
                                  delete errors[errKey][index];
                                  !Object.keys(errors[errKey]).length &&
                                    delete errors[errKey];
                                } else delete errors[errKey];
                                return {
                                  ...errors
                                };
                              } else return errors;
                            });

                          URL.revokeObjectURL(url);
                          audio.removeEventListener(
                            "loadedmetadata",
                            metadataListener,
                            false
                          );
                        };

                        const errorListener = ({ target: { error } }) => {
                          addError(
                            {
                              message: error.message,
                              code: error.code,
                              name: error.name
                            },
                            errKey,
                            index
                          );
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
                      for (const index in keyValue) {
                        if (Number(index) > -1)
                          validateDur(keyValue[index], index);
                      }
                    } else validateDur(keyValue);
                  } else {
                    if (node.multiple) {
                      for (const index in keyValue) {
                        if (Number(index) > -1 && keyValue[index].size > digit)
                          addError(`Maximum upload exceeded`, errKey, index);
                      }
                    } else if (keyValue.size > digit)
                      addError(`Maximum upload exceeded`, errKey);
                  }
                }
              };

              if (maxDuration) validateFileMax(maxDuration, "duration");

              if (maxUpload) validateFileMax(maxUpload, "upload");

              if (node.multiple) {
                if (mergeFile) {
                  if (returnFilesArray) {
                    keyValue = Array.from(formData[key] || "").concat(
                      keyValue.length ? Array.from(keyValue) : keyValue
                    );
                  } else keyValue = mergeFileList(formData[key], keyValue);
                } else if (returnFilesArray) keyValue = Array.from(keyValue);
              }
            }
            if (!withErr) {
              const withValidate = typeof validate === "function";
              const prop = {
                key,
                keyValue,
                value,
                dataName,
                dataType
              };

              if (validateType) {
                if (withValidate) addError(validate(prop));
                else
                  switch (key === "confirmPassword" ? key : node.type || key) {
                    case "email":
                      if (!isEmail(value))
                        addError((prop.error = "Invalid Email address"));
                      break;
                    case "url":
                      if (!isLink(value))
                        addError((prop.error = "Invalid Link"));
                      break;
                    case "password":
                      const status = isPassword(value);
                      if (status !== "Strong")
                        addError((prop.error = `${status} password`));

                      if (formData.confirmPassword) {
                        if (value === formData.confirmPassword)
                          status === "Strong" &&
                            setErrors(errors => {
                              deletePathFromObject(errors, "confirmPassword");
                              return errors;
                            });
                        else
                          addError(`Password don't match`, "confirmPassword");
                      }
                      break;
                    case "confirmPassword":
                      if (value !== formData.password)
                        addError((prop.error = `Password don't match.`));
                      break;

                    default:
                      break;
                  }
              } else if (withValidate) addError(validate(prop));
            }
            if (!withErr)
              // no error
              setErrors(errors => {
                deletePathFromObject(errors, key, dataName, dataType);
                return errors;
              });
          } // with value end of else
        } else if (!withInvalidField) {
          setErrors(errors => {
            deletePathFromObject(errors, key, dataName, dataType);
            return {
              ...errors
            };
          });
          deletePathFromObject(formData, key, dataName, dataType);
          return { ...formData };
        }

        return {
          ...formData,
          [key]: keyValue
        };
      });
    },
    [
      dataTypeMap,
      dataSize,
      required,
      withInvalidField,
      maxUpload,
      maxDuration,
      mergeFile,
      returnFilesArray
    ]
  );
  const reset = useCallback((formData, config = {}) => {
    setIsSubmitting(
      typeof config.isSubmitting === "boolean" ? config.isSubmitting : false
    );

    if (config.resetErrors) setErrors({});
    else if (config.errors) setErrors(config.errors);

    if (isObject(formData)) setFormData(formData);
    else if (!formData) setFormData({});
  }, []);

  let isInValid;

  if (stateCheck) {
    const _errors = { ...errors };

    if (_errors.password === "Medium password") delete _errors.password;

    isInValid =
      !!Object.keys(_errors).length ||
      (required === true
        ? !Object.keys(formData).length
        : withMapObj(required, formData, false));
  }

  return {
    formData: formData || placeholders || {},
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setErrors,
    isInValid
  };
};

export default useForm;
